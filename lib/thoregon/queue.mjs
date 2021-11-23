/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { persistenceRoot } from "./util.mjs";
import { isString }        from '/evolux.util';
import { doAsync }         from "/evolux.universe";
import QueueBase           from "./queuebase.mjs";

const T         = universe.T;
const REQUESTQ  = "q";
const RESPONSEQ = "a";

export default class Queue extends QueueBase {

    // todo: implement encrypt/decrypt for 2 parties!

    /**
     *
     * @param root
     * @return {Promise<Queue>}
     */
    static async bindConsumer(root, responseHandler) {
        const queue = new this();
        await queue.consumer(root, responseHandler);
        return queue;

    }

    static async bindProducer(root, requestHandler) {
        const queue = new this();
        await queue.producer(root, requestHandler);
        return queue;

    }

    async producer(root, requestHandler) {
        if (isString(root)) root = persistenceRoot.get(root);
        this.root = root;
        this.requestHandler = requestHandler;
        // this is the request Q
        root.get(REQUESTQ).map().on((item, key) => this.handleRequest(item, key));
    }

    async consumer(root, responseHandler) {
        if (isString(root)) root = persistenceRoot.get(root);
        this.root = root;
        this.responseHandler = responseHandler;
        // this is the response/error/status Q
        root.get(RESPONSEQ).map().on((item, key) => this.handleResponse(item, key));
    }

    close() {
        this.root.get(RESPONSEQ).map().off();
    }

    closeProducer() {
        this.root.get(REQUESTQ).map().off();
    }

    /*async*/ request(msg) {
        return new Promise(async (resolve, reject) => {
            try {
                const reqid = universe.random(5);
                const { encrypt, decrypt } = await this.getCrypto();
                const eentry               = T + JSON.stringify(await encrypt({ payload: msg }));
                this.root.get(REQUESTQ).get(reqid).put(eentry, (ack) => {
                    if (ack.err) {
                        console.log("REQUEST", ack.err, eentry);
                        reject(ack.err);
                        return;
                    }
                    resolve();
                });
                await doAsync();
            } catch (e) {
                reject(e);
            }
        })
    }


    /*async*/ respond(msg) {
        return new Promise(async (resolve, reject) => {
            try {
                const reqid = universe.random(5);
                const { encrypt, decrypt } = await this.getCrypto();
                const eentry               = T + JSON.stringify(await encrypt({ payload: msg }));
                this.root.get(RESPONSEQ).get(reqid).put(eentry, (ack) => {
                    if (ack.err) {
                        console.log("RESPOND", ack.err, eentry);
                        reject(ack.err);
                        return;
                    }
                    resolve();
                });
                await doAsync();
            } catch (e) {
                reject(e);
            }
        });
    }

    //
    // request handling
    //

    async handleRequest(item, key) {
        if (item == undefined) return;
        await doAsync();
        const { encrypt, decrypt } = await this.getCrypto();
        const sentry = JSON.parse(item.substr(2));
        let req = await decrypt(sentry);
        this.requestHandler(req, this);
    }

    async handleResponse(item, key) {
        if (item == undefined) return;
        await doAsync();
        const { encrypt, decrypt } = await this.getCrypto();
        const sentry = JSON.parse(item.substr(2));
        let res = await decrypt(sentry);
        this.responseHandler(res);
    }

    off() {
        this.root?.map().off();
    }


}
