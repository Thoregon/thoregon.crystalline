/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import QueueBase    from "./queuebase.mjs";
import Queue        from "./queue.mjs";
import { isString } from '/evolux.util';
import { doAsync }  from "/evolux.universe";

import { materialized, persistenceRoot } from "./util.mjs";

const T     = universe.T;

export default class Terminal extends QueueBase {

    //
    // Producer API
    //

    static async bindProducer(root, handler) {
        let terminal = new this();
        await terminal.open(root, handler);
        return terminal;
    }

    close() {
        this.off();
    }

    //
    // Consumer API
    //

    static async open(root) {
        const terminal = new this();
        await terminal.use(root);
        return terminal;
    }

    /*async*/ createQueue(handler) {
        return new Promise(async (resolve, reject) => {
            try {
                const connectid = universe.random(9);
                const queueroot = universe.random();

                const queue = await Queue.bindConsumer(queueroot, handler);

                // now notify the producer side about the new queue
                const { encrypt, decrypt } = await this.getCrypto();
                const queueentry           = await encrypt({ c: queueroot });
                const eentry               = T + JSON.stringify(queueentry);

                // store the request for a queue
                this.root.get(connectid).put(eentry, (ack) => {
                    if (ack.err) {
                        console.log("QUEUE", ack.err, eentry);
                        reject(ack.err);
                        return;
                    }
                    resolve(queue);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * producer listens to requests from the consumer
     *
     * @param root
     * @return {Promise<void>}
     */
    async open(root, handler) {
        if (isString(root)) root = persistenceRoot.get(root);
        this.root = root;
        this.connectHandler = handler;
        root.map().on(async (item, key) => this.connectRequest(item, key));
    }

    off() {
        this.root?.map().off();
    }

    async use(root) {
        if (isString(root)) root = persistenceRoot.get(root);
        this.root = root;
    }

    async connectRequest(item, key) {
        if (item == undefined) return;
        await doAsync();
        const sentry = JSON.parse(item.substr(2));
        const { encrypt, decrypt } = await this.getCrypto();
        const entry =  await decrypt(sentry);
        // todo [OPEN]: remove queue request entry for firewalls, queue established
        //  - must be a signed entry with a 'del' mark
        this.root.get(key).put(null);

        // now bind to queue
        if (entry) this.connectHandler(entry);
    }

}
