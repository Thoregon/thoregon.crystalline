/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { crystallize, decrystallize } from "/evolux.util/lib/serialize.mjs";
import RemoteConsumer                 from "./remoteconsumer.mjs";

const MAX_DISCOVER_DELAY = 800;     // timeout in milliseconds for discover requests

export default class NeulandConsumer extends RemoteConsumer {

    constructor(soul) {
        super();
        this.soul = soul;
        this.open = false;
    }


    static from(soul) {
        const consumer = new this(soul);
        consumer.mq = universe.mq;
        return consumer;
    }

    get mq() {
        return this._mq;
    }

    set mq(mq) {
        this._mq = mq;
    }

    //
    // RemoteConsumer Implementation
    //

    sendRequest(msg) {
        this.mq.sendInvoke(this.soul, msg, this.policy, this.peerid);
    }

    getResponse(evt) {
        return evt.data;
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
    // Provider Implementation
    //

    connect() {
        return new Promise((resolve, reject) => {
            universe.mq.discover(this.soul);
            this._request = { resolve, reject };
            this._reqtimeoutid = setTimeout(() => this.unknown(), MAX_DISCOVER_DELAY);
        })
    }

    //
    // neuland implementaiton
    //

    connected(data, policy, peerid) {
        if (this._reqtimeoutid) clearTimeout(this._reqtimeoutid);
        this.open = true;
        this.policy = policy;
        this.peerid = peerid;
        this._request?.resolve?.();
        setTimeout(() => {
            this.processInitQ();
        }, MAX_DISCOVER_DELAY);
    }

    unknown() {
        this._request?.reject?.(new Error("unknown service resource: " + this.soul));
    }

}
