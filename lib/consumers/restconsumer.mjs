/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import RemoteConsumer                               from "./remoteconsumer.mjs";
import { transportdeserialize, transportserialize } from "/evolux.util/lib/serialize.mjs";
import Facade                                       from "../facade.mjs";

/**
 * await a timeout
 * @param ms
 * @returns {Promise<unknown>}
 */
export const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const services = {};
const consumers = {};

const _waitQ = {};

export default class RESTConsumer extends RemoteConsumer {

    constructor(path, service) {
        super();
        this.path      = path;
        this.service   = service;
    }

    static async from(path, service) {
        const consumer  = new this(path, service);
        return consumer;
    }

    //
    // consumers
    //

    static async consumerHandler(path, servicename){
        const key = `${path}/${servicename}`;
        let consumer = consumers[key];
        if (!consumer) {
            consumer = consumers[key] = await RESTConsumer.from(path, servicename);
        }
        return consumer;
    }

    static /*async*/ consumerFor(path, servicename) {
        return new Promise(async (resolve, reject) => {
            const key = `${path}/${servicename}`;
            let service = services[key];
            if (!service) {
                if (_waitQ[key]) {
                    _waitQ[key].push(resolve);
                } else {
                    _waitQ[key] = [];
                    const consumer = await this.consumerHandler(path, servicename);
                    service = services[key] = await Facade.use(consumer);
                    const q = _waitQ[key]
                    delete _waitQ[key];
                    resolve(service);
                    for (const fn of q) {
                        fn(service);
                    }
                }
            }
        });
    }


    //
    // RemoteConsumer Implementation
    //

    sendRequest(data) {
        (async () => {
            try {
                const req = { path: this.service, data };
                const res = await fetch(this.path, {
                    method        : "POST",
                    mode          : "cors", // no-cors, *cors, same-origin
                    cache         : "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
                    credentials   : "same-origin", // include, *same-origin, omit
                    headers       : {
                        "Content-Type": "application/json",
                    },
                    redirect      : "follow", // manual, *follow, error
                    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                    body          : JSON.stringify(req), // body data type must match "Content-Type" header
                });     // encodeURIComponent(JSON.stringify(eventlog))

                if (!res.ok) {
                    console.log(">> REST: ", res);
                    throw Error(res.status + ': ' + res.statusText);
                }
                const json = await res.json();
                await this.handleResponse(json);
            } catch (e) {
                console.error("** RESTConsumer", this.path, e.message, e.stack);
            }
        })();
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

}