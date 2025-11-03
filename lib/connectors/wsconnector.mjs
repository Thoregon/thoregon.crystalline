/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import WSConsumer from "../consumers/wsconsumer.mjs";
import Facade     from "../facade.mjs";

const SA    = 'sa'
const NEXUS = 'nexus';

export default class WSConnector {

    constructor(agenturls) {
        this.agenturls  = agenturls;
        this.conns      = {}
        this.consumers  = {};
        this.services   = {};
        this._waitQ     = {};
        this._listeners = [];
        this._reconnect = {};
    }

    /**
     * Initializes and uses WebSocket connections for the provided agents.
     *
     * @param {Object} agenturls - An object where the keys are dynamic agent names and the values are WebSocket URLs.
     * @param {string} agenturls.<agentName> - The WebSocket URL for the agent, where `<agentName>` is the name of the agent.
     *
     * @example
     * use({
     *   agentA: 'wss://example.com',
     *   agentB: 'wss://otherexample.com'
     * });
     *
     * This will initialize WebSocket connections to the URLs provided in the agenturls object for each agent.
     */
    static use(agenturls) {
        const connector = new this(agenturls);
        universe.$wsconnector = connector;
        return connector;
    }

    //
    // Info
    //

    /*async*/ whenConnected(agentname) {
        return new Promise(async (resolve, reject) => {
            agentname = this.adjustAgentName$(agentname);
            if (this.conns[agentname]) resolve(this.conns[agentname]);
            let q = this._waitQ[agentname];
            if (!q) q = this._waitQ[agentname] = [];
            q.push(() => resolve(this.conns[agentname]));
        })
    }

    //
    // Lifecycle
    //

    async start() {
        this._stopreconnecting = false;
        Object.entries(this.agenturls).forEach(([name, url]) => {
            // todo:
            //  - check if same url is used with another name
            //  - it may not be ready until now, register to reuse the websocket
            this.connectToAgent(name, url);
            // this.startReconnect(name, url);
        });
    }

    async stop() {
        this._stopreconnecting = true;
        this._waitQ     = {};
        this._listeners = [];
        this._reconnect = {};
        Object.entries(this.conns).forEach(([name, ws]) => this.disconnect(name, ws));
    }

    processWaits(agentname) {
        const q = this._waitQ[agentname];
        if (!q) return;
        delete this._waitQ[agentname];
        q.forEach((fn) => { try { fn() } catch (e) {} });
    }

    //
    // listeners
    //

    addListener(listener) {
        this._listeners.push(listener);
    }

    removeListener(listener) {
        this._listeners = this._listeners.filter(listener => listener !== listener);
    }

    notifyOpened(agentname) {
        const listeners = this._listeners;
        listeners.forEach((listener) => {
            try {
                listener({ agent: agentname, state: 'opened' });
            } catch (e) {
                console.log('$$ WS Connector: Listener Error', e);
            }
        })
    }

    notifyClosed(agentname) {
        const listeners = this._listeners;
        listeners.forEach((listener) => {
            try {
                listener({ agent: agentname, state: 'closed' });
            } catch (e) {
                console.log('$$ WS Connector: Listener Error', e);
            }
        })
    }

    adjustAgentName$(agentname) {
        return agentname in this.agenturls ? agentname : NEXUS;
    }

    getConnection$(agentname) {
        return this.conns[agentname];
    }

    getAgentsConnected() {
        return Object.keys(this.conns);
    }

    isAgentConnected(agentname) {
        return !!this.getConnection$(agentname);
    }

    //
    //
    //

    send(agentname, msg) {
        agentname = this.adjustAgentName$(agentname);
        const conn = this.getConnection$(agentname);
        if (!conn) {
            // log or throw?
            return;
        }
        if (me?.anchor) msg.apiKey = me.anchor;
        conn.ws.send(JSON.stringify(msg));
    }

    async handleIncomming(agentname, evt) {
        const res = JSON.parse(evt);
        const service = res.path;
        const consumer = await this.consumerHandler(agentname, service);
        consumer.handleResponse(res);
    }

    //
    // consumers
    //

    async consumerHandler(agentname, servicename){
        agentname = this.adjustAgentName$(agentname);
        const key = `${agentname}/${servicename}`;
        let consumer = this.consumers[key];
        if (!consumer) {
            consumer = this.consumers[key] = await WSConsumer.from(agentname, servicename);
        }
        return consumer;
    }

    /*async*/ consumerFor(agentname, servicename) {
        return new Promise(async (resolve, reject) => {
            agentname = this.adjustAgentName$(agentname);
            const key = `${agentname}/${servicename}`;
            let service = this.services[key];
            if (service) {
                resolve(service);
            } else {
                if (this._waitQ[key]) {
                    this._waitQ[key].push(resolve);
                } else {
                    this._waitQ[key] = [];
                    const consumer = await this.consumerHandler(agentname, servicename);
                    service = this.services[key] = await Facade.use(consumer);
                    const q = this._waitQ[key]
                    delete this._waitQ[key];
                    resolve(service);
                    for (const fn of q) {
                        fn(service);
                    }
                }
            }
        });
    }

    //
    // connections
    //

    connectToAgent(name, url) {
        try {
            // console.log("-- WSConnector: Connect to agent", name, url);
            if (url.startsWith('http:')) url = url.replace('http:', 'ws:');
            if (url.startsWith('https:')) url = url.replace('https:', 'wss:');
            const ws     = new WebSocket(url, "neuland");
            ws.onopen    = (openEvent) => {
                this.conns[name] = { ws };
                console.log("-- WSConnector: WebSocket to " + name + " opened");
                this.stopReconnect(name);
                this.processWaits(name);
                this.notifyOpened(name);
            }
            ws.onmessage = (messageEvent) => {
                // console.log('' messageEvent.data);
                this.handleIncomming(name, messageEvent.data);
            };
            ws.onclose   = (closeEvent) => {
                // console.log(`-- WSConnector: WebSocket to ${name} closed`);
                this.disconnected(name, ws);
                this.notifyClosed(name);
            };
            ws.onerror = (errorEvent) => {
                // console.log('$$ WS Connector: Connection Error');
                this.startReconnect(name, url);
            }
        } catch (e) {
            // console.log('$$ WS Connector: Connection Error');
            this.startReconnect(name, url);
        }
    }

    disconnect(name, ws) {
        ws.close();
    }

    disconnected(name, ws) {
        delete this.conns[name];
        // todo [OPEN]: start try reconnect
        const url = this.agenturls[name];
        this.startReconnect(name, url);
    }

    startReconnect(name, url) {
        if (this._stopreconnecting) return;
        let reconnect = this._reconnect[name];
        if (!reconnect) reconnect = this._reconnect[name] = { retries: 1 };
        if (reconnect.timeoutid) return; // already reconnecting
        // console.log("-- WSConnector: start reconnecting", name);
        reconnect.timeoutid = setTimeout(() => {
            delete reconnect.timeoutid;
            console.log("-- WSConnector: reconnect", name);
            this.connectToAgent(name, url);
            this.startReconnect(name, url);
        }, this.reconnectInterval(reconnect.retries++));
    }

    reconnectInterval(retries = 1) {
        return retries > 100 ?  20000 : retries > 20 ? 8000 : retries > 10 ? 4000 : 2000;
    }

    stopReconnect(name) {
        const reconnect = this._reconnect[name];
        if (!reconnect) return;
        delete this._reconnect[name];
        // console.log("-- WSConnector: stop reconnect", name);
        if (reconnect.timeoutid) clearInterval(reconnect.timeoutid);
    }
}
