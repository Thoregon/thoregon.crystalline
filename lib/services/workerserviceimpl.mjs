/**
 * a wrapper for objects/classes to act as a service within a worker
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import JSProvider from "../providers/jsprovider.mjs";

export default class WorkerServiceImpl {

    constructor(port) {
        this.port = port;
    }

    static at(port) {
        const srv = new this(port);
        port.addEventListener('message', function(evt) {
            // console.log('Worker received arguments:', e.data);
            srv.handleRequest(evt.data);
        });
        port.start();
        return srv;
    }

    handleRequest(req) {
        try {
            switch (req.cmd) {
                case 'get':
                    this.get(req);
                    break;
                case 'set':
                    this.set(req);
                    break;
                case 'invoke':
                    this.invoke(req);
                    break;
                case 'subscribe':
                    this.subscribe(req);
                    break;
                case 'unsubscribe':
                    this.unsubscribe(req);
                    break;
                case 'querySchema':
                    this.querySchema(req);
                    break;
                case 'use':
                    // use the url to instantiate the
                    this.use(req);
                    break;
            }
        } catch (e) {
            this.respond(req, { error: 500, msg: e.stack ? e.stack : e.message });
        }

    }

    respond(req, msg) {
        const res = { resid: req.resid, ...msg };
        this.port.postMessage(res);
    }

    async use(req) {
        const url = req.url;
        const Cls = (await import(url)).default;
        this.provider = JSProvider.with(new Cls());
        this.respond(req, { used: true });
    }

    async querySchema(req) {
        const schema = await this.provider.querySchema();
        this.respond(req, { schema });
    }

    async get(req) {
        const property = req.property;
        const value = await this.provider.get(property);
        this.respond(req, { value });
    }

    async set(req) {
        const property = req.property;
        const value = req.value;
        await this.provider.set(property, value);
        this.respond(req, { value });
    }

    async invoke(req) {
        const name = req.name;
        const args = req.args;
        const result = await this.provider.invoke(name, args);
        this.respond(req, { result });
    }

    async subscribe(req) {
        const name = req.name;
        const value = await this.provider.subscribe(name, (evt) => this.handleSubscriptionMessage(name, evt));
        this.respond(req, { name });
    }

    async unsubscribe(req) {
        const name = req.name;
        const value = await this.provider.unsubscribe(name);
        this.respond(req, { name });
    }

    async handleSubscriptionMessage(name, evt) {
        const res = { subname: name, evt };
        this.port.postMessage(res);
    }

}

// polyfill

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

// now connect
onconnect = (evt) => {
    const port = evt.ports[0];  // get the port
    WorkerServiceImpl.at(port);
}
