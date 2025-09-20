/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { timeout }                                  from "/evolux.universe";
import RemoteConsumer                               from "./remoteconsumer.mjs";
import { transportdeserialize, transportserialize } from "/evolux.util";

const wsconnector = () => universe.wsconnector;

export default class WSConsumer extends RemoteConsumer {

    constructor(agent, service) {
        super();
        this.agent   = agent;
        this.service = service;
    }

    static async from(agent, service) {
        const consumer  = new this(agent, service);
        wsconnector().addListener(async (evt) => await consumer.connectionStateChanged(evt));
        return consumer;
    }

    //
    // RemoteConsumer Implementation
    //

    sendRequest(data) {
        const req = { path: this.service, data };
        wsconnector().send(this.agent, req)
    }

    getResponse(res) {
        return res;
    }

    //
    // Serialization
    //


    async serialize(obj) {
        return transportserialize(obj);
    }


    async deserialize(value) {
        return await transportdeserialize(value);
    }


    //
    // Provider Implementation
    //

    async connect() {
        // nothiing to do
        // todo: eventually wait until agent is connected
        await wsconnector().whenConnected(this.agent);
    }

    //
    // connection
    //

    async connectionStateChanged(evt) {
        if (evt.agent === this.agent && evt.state === 'opened') {
            // todo [REFACTOR]: check if required service is running on agent
            await timeout(4000);
            await this.resubscribeRegisteredListeners();
        }
    }

    //
    // debugging and testing
    //

    describe() {
        // implement by  subclass
        return 'WSConsumer:';
    }
}