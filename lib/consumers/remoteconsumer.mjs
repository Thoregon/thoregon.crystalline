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

    async handleResponse(evt) {
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
            res            = await this.deserialize(res.evt);
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
        return await this.deserialize((await this.remoteRequest({ cmd: 'invoke', name, args: serializedArgs })).result);
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

    async close() {
        super.close();
    }

}