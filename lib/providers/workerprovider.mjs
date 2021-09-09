/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import JSInspector     from "../jsinspector.mjs";
import RemoteProvider  from "./remoteprovider.mjs";


let i = 0;

export default class WorkerProvider extends RemoteProvider {

    constructor(...args) {
        super(...args);
    }


    static from(workerurl) {
        const provider      = new this();
        provider._worker    = new SharedWorker('/thoregon.crystalline/lib/services/workerserviceimpl.mjs?service=' + workerurl, { type: 'module' });  // { name: '',  type: 'module' }
        provider._workerurl = workerurl;
        return provider;
    }

    //
    // RemoteProvider Implementation
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

    async connect(facade) {
        this._facade = facade;
        const port = this._worker.port;
        port.start();
        port.addEventListener('message', (evt) => this.handleResponse(evt));
        await this.remoteRequest({ cmd: 'use', url: this._workerurl });   // init the
    }

}
