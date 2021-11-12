/**
 * Implement a request/response Q bridge to a async or remote service
 *
 * Provider on client side
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import RemoteProvider  from "./remoteprovider.mjs";

export default class ThoregonProvider extends RemoteProvider {

    constructor(root, allowedkeys) {
        super();
        Object.assign(this, { srvroot: root, allowedkeys })
    }

    static at(root, allowedkeys) {
        const provider = new this(root, allowedkeys);
        return provider;
    }

    //
    // RemoteProvider Implementation
    //

    sendRequest(msg) {

    }

    getResponse(evt) {
        return evt.data;
    }

    //
    // Provider Implementation
    //

    async connect(facade) {
        this._facade = facade;

        this.queueroot = universe.random();
/*
        const queue = universe.archetim.persistenceRoot[this.queueroot];
        this.queue = queue;
        queue.on(evt => this.handleResponse(evt));

        const service = universe.archetim.persistenceRoot[this.srvroot];
        this.service = service;
*/

        await this.remoteRequest({ cmd: 'connect', where: this.queueroot });
    }




}
