/**
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

import ServiceProvider from "./serviceprovider.mjs";
import JSInspector     from "../jsinspector.mjs";

let i = 1;

export default class RemoteProvider extends ServiceProvider {

    constructor(...args) {
        super(...args);
        this._requestQ      = [];
        this._subscriptions = {};
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
            this.sendRequest(msg);
        });
    }

    handleResponse(evt) {
        let res     = this.getResponse(evt);
        const resid = res.resid;
        let resolve, reject;
        if (resid) {
            // request handlers found for the response
            const handlers = this._requestQ[resid];
            resolve        = handlers.resolve;
            reject         = handlers.reject;
        } else {
            // if no request handlers, it may be a subscription (
            const subname = res.subname;
            if (!subname) return;   // log?
            const handler  = this._subscriptions[subname];
            resolve        = handler;
            reject         = console.log;
            res            = res.evt;
        }
        try {
            if (res.error) {
                reject({ error: res.error, msg: res.msg, stack: res.stack });
            } else {
                resolve(res);
            }
        } finally {
            delete this._subscriptions[resid];
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

    //
    // Provider Implementation
    //

    async get(property) {
        return (await this.remoteRequest({ cmd: 'get', property })).value;
    }

    async set(property, value) {
        return await this.remoteRequest({ cmd: 'set', property, value });
    }

    async invoke(name, args) {
        return (await this.remoteRequest({ cmd: 'invoke', name, args })).result;
    }

    async subscribe(name, handler) {
        if (this._subscriptions[name]) return false;
        this._subscriptions[name] = handler;
        return await this.remoteRequest({ cmd: 'subscribe', name });
    }

    async unsubscribe(name) {
        if (!this._subscriptions[name]) return;
        delete this._subscriptions[name];
        return await this.remoteRequest({ cmd: 'unsubscribe', name });
    }

    async querySchema() {
        if (this._schema) return this._schema;
        const res    = await this.remoteRequest({ cmd: 'querySchema' });
        this._schema = res.schema;
        return this._schema;
    }

}

/*
    todo: lebible stack, drop stack from  JSProvider (invoke/get/set/subscribe/unsubscribe)
    ReferenceError: retrurn is not defined
    at Proxy.is (http://localhost:7777/thoregon.identity/lib/identityservice.mjs:49:9)
    at JSProvider.invoke (http://localhost:7777/thoregon.crystalline/lib/providers/jsprovider.mjs:37:36)
    at WorkerServiceImpl.invoke (http://localhost:7777/thoregon.crystalline/lib/services/workerserviceimpl.mjs:101:44)
    at WorkerServiceImpl.handleRequest (http://localhost:7777/thoregon.crystalline/lib/services/workerserviceimpl.mjs:41:32)
    at MessagePort.<anonymous> (http://localhost:7777/thoregon.crystalline/lib/services/workerserviceimpl.mjs:24:17)
 */
