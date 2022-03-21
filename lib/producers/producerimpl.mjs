/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import { ErrNotImplemented } from "../errors.mjs";

let JSConsumer;

export default class ProducerImpl {

    exit() {
        // implement by subclass
    }

    close(req, origin) {
        this.respond(origin || req, { closed: true }, req);
    }

    respond(origin, msg, req) {
        throw ErrNotImplemented("respond");
    }

    async handleRequest(req, origin) {
        const curreq = req;
        origin = origin || req;
        try {
            switch (req.cmd) {
                case 'get':
                    await this.get(req, origin);
                    break;
                case 'set':
                    await this.set(req, origin);
                    break;
                case 'invoke':
                    await this.invoke(req, origin);
                    break;
                case 'subscribe':
                    await this.subscribe(req, origin);
                    break;
                case 'unsubscribe':
                    await this.unsubscribe(req, origin);
                    break;
                case 'querySchema':
                    await this.querySchema(req, origin);
                    break;
                case 'use':
                    // use the url to instantiate the
                    await this.use(req, origin);
                    break;
                case 'close':
                    // use the url to instantiate the
                    await this.close(req, origin);
                    break;
            }
        } catch (e) {
            this.handleError(origin, curreq, e);
        }
    }

    handleError(origin, req, e, info) {
        this.respond(origin, { error: 500, msg: e.message ? e.message : e, stack: e.stack ? e.stack : e.message, info }, req);
    }

    async use(req, origin) {
        if (this.consumer) return;  // was already established (SharedWorker)
        await this.jsConsumer();
        const url = req.url;
        const Cls = (await import(url)).default;
        this.consumer = JSConsumer.with(new Cls());
        this.respond(origin || req, { used: true }, req);
    }

    async querySchema(req, origin) {
        if (!this.consumer) {
            await this.jsConsumer();
            this.consumer = JSConsumer.with(this.service);
        }
        const schema = await this.consumer.querySchema();
        this.respond(origin || req, { schema }, req);
    }

    async get(req, origin) {
        const property = req.property;
        const value    = await this.consumer.get(property);
        const ser      = await this.serialize(value);
        this.respond(origin || req, { value: ser }, req);
    }

    async set(req, origin) {
        const property = req.property;
        const value    = req.value;
        await this.consumer.set(property, value);
        this.respond(origin || req, { ok: 1 }, req);
    }

    async invoke(req, origin) {
        const name    = req.name;
        const serargs = req.args;
        const args    = await this.deserialize(serargs);
        const result  = await this.consumer.invoke(name, args);
        const ser     = await this.serialize(result);
        this.respond(origin || req, { result: ser }, req);
    }

    async subscribe(req, origin) {
        const name = req.name;
        const value = await this.consumer.subscribe(name, (evt) => this.handleSubscriptionMessage(name, evt, origin));
        this.respond(origin || req, { name }, req);
    }

    async unsubscribe(req, origin) {
        const name = req.name;
        const value = await this.consumer.unsubscribe(name);
        this.respond(origin || req, { name }, req);
    }

    async handleSubscriptionMessage(name, evt, origin) {
        const ser = await this.serialize(evt);
        const res = { subname: name, evt: ser };
        this.port.postMessage(res);
    }

    async jsConsumer() {
        if (!JSConsumer) JSConsumer = (await import('../consumers/jsconsumer.mjs')).default
        return JSConsumer;
    }

    async serialize(obj) {
        return obj;
    }

    async deserialize(value) {
        return value;
    }

}

// polyfill
// todo [REFACTOR]: Even if all imports are managed by the ServiceWorker, the universe.utils are not present!

if (!Array.prototype.unique) Object.defineProperty(Array.prototype, 'unique', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function() {
        var a = this.concat();
        for(var i=0; i<a.length; ++i) {
            for(var j=i+1; j<a.length; ++j) {
                if(a[i] === a[j])
                    a.splice(j--, 1);
            }
        }

        return a;
    }
})
