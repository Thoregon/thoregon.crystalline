/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import RemoteConsumer  from "./remoteconsumer.mjs";

export default class WorkerConsumer extends RemoteConsumer {

    constructor(...args) {
        super(...args);
    }


    static from(workerurl) {
        const provider      = new this();
        provider._worker    = new SharedWorker('/thoregon.crystalline/lib/producers/workerproducerimpl.mjs?service=' + workerurl, { type: 'module' });  // { name: '',  type: 'module' }
        provider._workerurl = workerurl;
        return provider;
    }

    //
    // RemoteConsumer Implementation
    //

    sendRequest(msg) {
        this._worker.port.postMessage(msg);
    }

    getResponse(evt) {
        return evt.data;
    }

    //
    // Provider Implementation
    //

    async connect() {
        const port = this._worker.port;
        port.start();
        port.addEventListener('message', (evt) => this.handleResponse(evt));
        await this.remoteRequest({ cmd: 'use', url: this._workerurl });   // init the
    }

}
