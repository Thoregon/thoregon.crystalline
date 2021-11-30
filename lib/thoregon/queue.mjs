/**
 *
 * todo [OPEN]:
 *  - get rid of this relly bad workaround to get the first response working --> $@WORKAROUND
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { persistenceRoot } from "./util.mjs";
import { isString }        from '/evolux.util';
import { doAsync }         from "/evolux.universe";
import QueueBase           from "./queuebase.mjs";
import NullLogger          from "../nulllogger.mjs";

const T         = universe.T;
const REQUESTQ  = "q";
const RESPONSEQ = "a";

export default class Queue extends QueueBase {

    // todo: implement encrypt/decrypt for 2 parties!

    constructor(props) {
        super(props);
        this.logger = (globalThis.thoregon && thoregon.archetimlogger) ? thoregon.archetimlogger : new NullLogger();
        this.workaround = { init: false };
    }


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
        this.logger.log('Queue', 'bind producer');
        await doAsync();
        root.get(REQUESTQ).once((item, key) => {
            root.get(REQUESTQ).map().on((item, key) => this.handleRequest(item, key));
            this.logger.log('Queue', 'bound producer');
        });
    }

    async consumer(root, responseHandler) {
        if (isString(root)) root = persistenceRoot.get(root);
        this.root = root;
        this.responseHandler = responseHandler;
        // this is the response/error/status Q
        this.logger.log('Queue', 'bind consumer');
        await doAsync();
/*  shoukd be here w/o $@WORKAROUND
        root.get(RESPONSEQ).once((item, key) => {
            root.get(RESPONSEQ).map().on((item, key) => this.handleResponse(item, key));
            this.logger.log('Queue', 'bound consumer');
        })
*/
    }

    close() {
        this.logger.log('Queue', 'close');
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
                const eentry               = T + JSON.stringify(await encrypt({ c: msg }));
                this.logger.log('Queue', 'request', msg, reqid, eentry);
                this.root.get(REQUESTQ).get(reqid).put(eentry, (ack) => {
                    if (ack.err) {
                        console.log("REQUEST", ack.err, eentry);
                        // reject(ack.err);
                        return;
                    }
                    this.logger.log('Queue', 'requested', msg, reqid, eentry);
                    this.initResponse();    // $@WORKAROUND
                });
                await doAsync();
                resolve();
            } catch (e) {
                reject(e);
            }
        })
    }

    //
    // $@WORKAROUND
    // this is a bad workaround to enable change events from gun
    // I really hate this, better ideas/fixes are welcome
    //
    initResponse() {
        if (this.workaround.init) return;
        this.workaround.timeout = setTimeout(() => {
            this.root.get(RESPONSEQ).once((item, key) => {
                this.logger.log('Queue', 'bound consumer');
                this.root.get(RESPONSEQ).map().on((item, key) => this.handleResponse(item, key));
            });
            this.logger.log('Queue', 'repeat initRequest');
            this.initResponse();
        }, 300);
        this.logger.log('Queue', 'initRequest');
    }


    /*async*/ respond(msg) {
        return new Promise(async (resolve, reject) => {
            try {
                const reqid = universe.random(5);
                const { encrypt, decrypt } = await this.getCrypto();
                const eentry               = T + JSON.stringify(await encrypt({ c: msg }));
                this.logger.log('Queue', 'response', msg, reqid, eentry);
                this.root.get(RESPONSEQ).get(reqid).put(eentry, (ack) => {
                    if (ack.err) {
                        console.log("RESPOND", ack.err, eentry);
                        // reject(ack.err);
                        return;
                    }
                    this.logger.log('Queue', 'responded', msg, reqid, eentry);
                });
                await doAsync();
                resolve();
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
        // todo [OPEN]: remove request after it has been recognised and handled
    }

    async handleResponse(item, key) {
        if (item == undefined) return;
        this.responseInitialized();     // $@WORKAROUND
        await doAsync();
        const { encrypt, decrypt } = await this.getCrypto();
        const sentry = JSON.parse(item.substr(2));
        let res = await decrypt(sentry);
        this.responseHandler(res);
        // todo [OPEN]: remove response after it has been recognised and handled
    }

    responseInitialized() {
        // $@WORKAROUND
        if (this.workaround.timeout) {
            clearTimeout(this.workaround.timeout);
            this.workaround.init = true;
        }
    }

    off() {
        this.root?.map().off();
    }


}
