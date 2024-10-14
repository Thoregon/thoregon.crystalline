/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ProducerImpl                                    from "./producerimpl.mjs";
import { transportreqdeserialize, transportserialize } from "/evolux.util";

export default class RestProducer extends ProducerImpl {

    constructor(name, service) {
        super();
        this.name    = name;
        this.service = service;
    }

    static async with(name, service) {
        const producer = new this(name, service);
        return producer;
    }

    //
    // remote producer impl
    //

    respond(ws, msg, req) {
        const res = { path: this.name, resid: req.resid, ...msg };
        return res;
    }

    // no subscription supported currently, possibly implement with webhooks
    async subscribe(req, origin) {} // todo: answer error
    async unsubscribe(req, origin, handler) {}
    async handleSubscriptionMessage(name, evt, origin) {}

    //
    // Serialization
    //

    async serialize(obj) {
        // if (obj == undefined) return '';
        return transportserialize(obj, { withmethods: true });
    }


    async deserialize(value) {
        if (value == undefined) return;
        // const { obj, refs } = transportreqdeserialize(value);
        const obj = transportreqdeserialize(value);
        return obj;
    }

}