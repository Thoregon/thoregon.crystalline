/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ProducerImpl                   from "./producerimpl.mjs";
import { crystallize, decrystallize } from "/evolux.util/lib/serialize.mjs";

export default class NeulandProducer extends ProducerImpl {

    constructor(soul, service) {
        super();
        this.soul      = soul;
        this.service   = service;
        this.respondto = new Map();
    }

    // compatibility
    static async with(root, service) {
        return this.at(root, service);
    }

    static at(soul, service) {
        const producer = new this(soul, service);
        return producer;
    }

    get mq() {
        return this._mq;
    }

    set mq(mq) {
        this._mq = mq;
    }

    close() {
        this.open = false;
        delete this._mq;
    }

    //
    // producer impl
    //

    async handleRequest(soul, req, policy, peerid) {
        const origin = { soul, policy, peerid };
        super.handleRequest(req, origin);
    }

    respond(origin, msg, req) {
        msg.resid = req.resid;
        const { soul, policy, peerid } = origin;
        this.mq.sendResult(soul, msg, policy, peerid);
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
