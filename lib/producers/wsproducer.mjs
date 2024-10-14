/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ProducerImpl                                    from "./producerimpl.mjs";
import { transportreqdeserialize, transportserialize } from "/evolux.util";

export default class WSProducer extends ProducerImpl {

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
        ws.send(JSON.stringify(res));
    }

    async handleSubscriptionMessage(name, evt, origin) {
        delete evt.obj;
        const ser = await this.serialize(evt);
        const res = { subname: name, path: this.name, evt: ser };
        origin.send(JSON.stringify(res));
    }

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