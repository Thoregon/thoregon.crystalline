/**
 *
 * Producer: Service on Implementation side
 *
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ServiceImpl from "./serviceimpl.mjs";
import Terminal    from "../thoregon/terminal.mjs";
import Queue       from "../thoregon/queue.mjs"

import { doAsync, timeout } from "/evolux.universe";

export default class ThoregonProducer extends ServiceImpl {

    static async with(root, service) {
        const srv = new this();
        await srv.bind(root, service);
        return srv;
    }

    exit() {
        this.source?.off();
        delete this.source;
    }

    close(req, origin) {
        origin.closeProducer();
        super.close(req, origin);
    }

    async bind(root, service) {
        this.root    = root;
        this.service = service;
        this.source  = await Terminal.bindProducer(root, (q) => this.handleConnect(q));
    }

    async handleConnect(q) {
        const queue = await Queue.bindProducer(q, (req, queue) => this.handleRequest(req, queue));
    }

    async handleSubscriptionMessage(name, evt, origin) {
        const res = { subname: name, evt };
        this.respond(origin, res, evt);
    }

    async handleRequest(request, queue) {
        await doAsync();
        await super.handleRequest(request, queue);
    }

    async use(req, origin) {
        console.log("ThoregonProducer doesn't allow 'use'");
    }

    respond(queue, msg, req) {
        msg.resid = req.resid;
        queue.respond(msg);
    }
}
