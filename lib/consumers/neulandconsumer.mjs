/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import RemoteConsumer from "./remoteconsumer.mjs";

export default class NeulandConsumer extends RemoteConsumer {

    constructor(props) {
        super(props);
        this.open = false;
    }


    static from(soul) {
        const consumer = new this();
        universe.mq.addConsumer(soul, this);
        return consumer;
    }

    //
    // RemoteConsumer Implementation
    //

    sendRequest(msg) {
    }

    getResponse(evt) {
        return evt.data;
    }

    //
    // Provider Implementation
    //

    async connect() {
        universe.mq.connect(this);
    }
}
