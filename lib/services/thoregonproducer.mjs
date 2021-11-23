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

/*
    async processEnqueuedRequests(q) {
        await doAsync(); // await timeout(200);
        const queue = await Queue.from(q);
        for await (const prop of queue.propertyNames) {
            const request = await queue[prop];
            await this.handleRequest({ property: prop, obj: queue });
        }
    }
*/

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
