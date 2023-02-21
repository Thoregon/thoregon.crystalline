/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import RemoteConsumer from "./remoteconsumer.mjs";

const MAX_DISCOVER_DELAY = 6000; // 160;     // timeout in milliseconds for discover requests

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
    // Provider Implementation
    //

    connect() {
        return new Promise((resolve, reject) => {
            universe.mq.discover(this.soul);
            this._request = { resolve, reject };
            // this._reqtimeoutid = setTimeout(() => this.unknown(), MAX_DISCOVER_DELAY);
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
    }

    unknown() {
        this._request?.reject?.(new Error("unknown service resource: " + this.soul));
    }

}
