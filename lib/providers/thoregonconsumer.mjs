/**
 * Implement a request/response Q bridge to a async or remote service
 *
 * Provider on client side
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import RemoteProvider from "./remoteprovider.mjs";
import Terminal    from "../thoregon/terminal.mjs";

import { doAsync, timeout } from "/evolux.universe";

export default class ThoregonConsumer extends RemoteProvider {

    constructor(root) {
        super();
        this.root = root;
    }

    static at(root) {
        const consumer = new this(root);
        return consumer;
    }

    //
    // RemoteProvider Implementation
    //

    async sendRequest(msg) {
        if (!this.queue) return;
        const queue = this.queue;
        await queue.request(msg);
    }

    async processResponse(response, resolve) {
        resolve(response);
    }

    async processError(error, reject) {
        reject(error);
    }

    getResponse(response) {
        return response;
    }

    //
    // helper
    //

    //
    // Consumer Implementation
    //

    async connect(facade) {
        this._facade = facade;
        const root = this.root;
        const terminal = await Terminal.open(root);

        const queue = await terminal.createQueue(async (evt) => this.handleResponse(evt));
        this.queue  = queue;
    }

    async handleResponse(evt) {
        await doAsync();
        const res = evt;
        return super.handleResponse(res);
    }

    async close() {
        super.close();
        const res    = await this.remoteRequest({ cmd: 'close', q: this.root });
        this.queue?.close();
    }


}
