/**
 *
 * Producer: Service on Implementation side
 *
 * todo [OPEN]
 *  - consider timeout for queues and requests
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { isFunction } from "/evolux.util";

import ProducerImpl   from "./producerimpl.mjs";
import Terminal       from "../thoregon/terminal.mjs";
import Queue          from "../thoregon/queue.mjs"
import NullLogger     from "../nulllogger.mjs";

import { crystallize, decrystallize } from "/evolux.util/lib/serialize.mjs";
import { doAsync, timeout }           from "/evolux.universe";

export default class ThoregonProducer extends ProducerImpl {

    constructor(props) {
        super(props);
        this.logger  = (globalThis.thoregon && thoregon.archetimlogger) ? thoregon.archetimlogger : new NullLogger();
    }


    static async with(root, service) {
        const srv = new this();
        await srv.bind(root, service);
        return srv;
    }

    async init({ instance, settings }) {
        const service = this.service;
        if (isFunction(service.init)) await service.init({ instance, settings });
    }

    exit() {
        this.source?.off();
        delete this.source;
    }

    close(req, origin) {
        this.logger.log('ThoregonProducer', 'close', req);
        origin.closeProducer();
        super.close(req, origin);
        this.logger.log('ThoregonProducer', 'closed');
    }

    async bind(root, service) {
        this.root    = root;
        this.service = service;
        this.logger.log('ThoregonProducer', 'bind', root);
        this.source  = await Terminal.bindProducer(root, (q) => this.connectQueue(q));
        this.logger.log('ThoregonProducer', 'bound');
    }

    async connectQueue(q) {
        this.logger.log('ThoregonProducer', 'connect Queue', q);
        const queue = await Queue.bindProducer(q, (req, queue) => this.handleRequest(req, queue));
    }

    async handleSubscriptionMessage(name, evt, origin) {
        this.logger.log('ThoregonProducer', 'handleSubscriptionMessage', name, evt);
        const res = { subname: name, evt };
        this.respond(origin, res, evt);
    }

    async handleRequest(request, queue) {
        await doAsync();
        this.logger.log('ThoregonProducer', 'handleRequest', request);
        await super.handleRequest(request, queue);
    }

    async use(req, origin) {
        console.log("ThoregonProducer doesn't allow 'use'");
    }

    respond(queue, msg, req) {
        msg.resid = req.resid;
        this.logger.log('ThoregonProducer', 'respond', msg);
        queue.respond(msg);
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
}
