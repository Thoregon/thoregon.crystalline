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
import Terminal       from "../thoregon/terminal.mjs";
import NullLogger     from "../nulllogger.mjs";

import { doAsync, timeout } from "/evolux.universe";

export default class ThoregonConsumer extends RemoteProvider {

    constructor(root) {
        super();
        this.root = root;
        this.logger  = (globalThis.thoregon && thoregon.archetimlogger) ? thoregon.archetimlogger : new NullLogger();
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
        this.logger.log('ThoregonConsumer', 'sendRequest', msg);
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
        this.logger.log('ThoregonConsumer', 'open terminal');
        const terminal = await Terminal.open(root);

        this.logger.log('ThoregonConsumer', 'create queue');
        const queue = await terminal.createQueue(async (evt) => this.handleResponse(evt));
        this.logger.log('ThoregonConsumer', 'queue created', queue);
        this.queue  = queue;
    }

    async handleResponse(evt) {
        await doAsync();
        const res = evt;
        this.logger.log('ThoregonConsumer', 'handleResponse', res);
        return super.handleResponse(res);
    }

    async close() {
        super.close();
        this.logger.log('ThoregonConsumer', 'close');
        const res    = await this.remoteRequest({ cmd: 'close', q: this.root });
        this.logger.log('ThoregonConsumer', 'closed');
        this.queue?.close();
    }


}
