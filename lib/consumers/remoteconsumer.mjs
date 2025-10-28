/**
 * can be used as baseclass to implement async and/or distributed service
 *
 * implements an async request/response queue
 * in this case there is no direct response
 * and no handler for a specific request.
 *
 * the (any) response has to be matched to a
 * previous request
 *
 * Use for async message passing like websockets, web workers, ...
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ServiceConsumer from "./serviceconsumer.mjs";

let i = 1;

export default class RemoteConsumer extends ServiceConsumer {

    constructor(...args) {
        super(...args);
        this._requestQ      = [];
        this._subscriptions = {};
        this._initQ         = [];
    }

    //
    // request/response management
    //

    /*async*/
    remoteRequest(msg) {
        return new Promise((resolve, reject) => {
            const resid           = i++;
            this._requestQ[resid] = { resolve, reject };
            msg.resid             = resid;
            // console.log("-- RemoteConsumer::remoteRequest", resid, msg);
            try {
                this.sendRequest(msg);
            } catch (e) {
                reject(e);
            }
        });
    }

    async handleResponse(evt) {
        let res     = this.getResponse(evt);
        const resid = res.resid;
        let resolve, reject;
        if (resid) {
            // request handlers found for the response
            const handlers = this._requestQ[resid];
            if (!handlers) {
                console.log("-- RemoteConsumer::handleResponse: No handlers found", resid, evt);
                return;
            }
            resolve        = handlers.resolve;
            reject         = handlers.reject;
            try {
                if (res?.error) {
                    // reject({ error: res.error, msg: res.msg, stack: res.stack });
                    reject(res.msg);
                } else {
                    resolve(res);
                }
            } finally {
                // console.log("-- RemoteConsumer::handleResponse: response processed", resid, evt);
                delete this._requestQ[resid];
            }
        } else {
            // if no request handlers, it may be a subscription (
            const subname = res.subname ?? res.name;
            if (!subname) return;   // log?
            const handlers  = this._subscriptions[subname];
            res            = await this.deserialize(res.evt);
            if (res?.error) {
                console.log(res.error);
                return;
            }
            handlers.forEach((handler) => {
                try {
                    handler({ ...res });
                } catch (e) {
                    console.log(e);
                }
            });
        }
    }

    //
    // init Q
    //

    addInitQ(fn) {
        // if (this._facade) return fn();
        if (!this._initQ) return fn();
        this._initQ.push(fn);
    }

    processInitQ() {
        const q = this._initQ;
        delete this._initQ;
        for (const fn of q) {
            try {
                fn(this);
            } catch (e) {
                console.log("RemoteConsumer.processInitQ", e);
            }
        }
    }

    //
    // implement by subclass
    //

    /**
     * implement the real request to the service
     * @param msg
     */
    sendRequest(msg) {
        // implement by subclass
    }

    /**
     * extract the payload from the response
     * @param evt
     */
    getResponse(evt) {
        // implement by subclass
        return evt;
    }

    async serialize(obj) {
        return obj;
    }

    async deserialize(value) {
        return value;
    }

    async serializeArgs(args) {
        const serialized = [];
        for await (const arg of args) {
            serialized.push(await this.serialize(arg));
        }
        return serialized;
    }

    //
    // Provider Implementation
    //

    async get(property) {
        return await this.deserialize((await this.remoteRequest({ cmd: 'get', property })).value);
    }

    async set(property, value) {
        return await this.remoteRequest({ cmd: 'set', property, value: await this.serialize(value) });
    }

    async invoke(name, args) {
        const serializedArgs = await this.serializeArgs(args);
        const res = (await this.remoteRequest({ cmd: 'invoke', name, args: serializedArgs })).result;
        return await this.deserialize(res);
    }

    async subscribe(name, handler, args) {
        if (!this._subscriptions[name]) this._subscriptions[name] = [];
        handler.args = args;
        this._subscriptions[name].push(handler);
        return await this.remoteRequest({ cmd: 'subscribe', name, args });
    }

    async unsubscribe(name, handler) {
        if (!this._subscriptions[name]) return;
        this._subscriptions = subscriptions.filter((sub) => sub !== handler);
        return await this.remoteRequest({ cmd: 'unsubscribe', name });
    }

    async resubscribeRegisteredListeners(){
        const events = Object.keys(this._subscriptions);
        for await (const name of events) {
            const handlers = this._subscriptions[name];
            for await (const handler of handlers) {
                const args = handler.args;
                await this.remoteRequest({ cmd: 'subscribe', name, args });
            }
        }
    }

    async querySchema() {
        if (this._schema) return this._schema;
        const res    = await this.remoteRequest({ cmd: 'querySchema' });
        this._schema = res.schema;
        return this._schema;
    }

    async close() {
        super.close();
    }

    //
    // debugging and testing
    //

    describe() {
        // implement by  subclass
        return 'RemoteConsumer';
    }
}
