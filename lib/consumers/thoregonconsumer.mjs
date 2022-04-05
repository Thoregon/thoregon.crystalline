/**
 * Implement a request/response Q bridge to a async or remote service
 *
 * Provider on client side
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import RemoteConsumer from "./remoteconsumer.mjs";
import Terminal       from "../thoregon/terminal.mjs";
import NullLogger     from "../nulllogger.mjs";

import { crystallize, decrystallize } from "/evolux.util/lib/serialize.mjs";
import { doAsync, timeout }           from "/evolux.universe";

export default class ThoregonConsumer extends RemoteConsumer {

    constructor(root) {
        super();
        this.root = root;
    }

    static at(root) {
        const consumer = new this(root);
        return consumer;
    }

    //
    // RemoteConsumer Implementation
    //

    async sendRequest(msg) {
        if (!this.queue) return;
        const queue = this.queue;
        if (this.timeout) {
            msg.now = universe.now.getTime();
            msg.timeout = this.timeout;
        }
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
    // Serialization
    //


    async serialize(obj) {
        return crystallize(obj);
    }


    async deserialize(value) {
        return decrystallize(value);
    }

    //
    // helper
    //

    //
    // Consumer Implementation
    //

    async connect() {
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
