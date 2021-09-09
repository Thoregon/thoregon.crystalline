/**
 * a wrapper for objects/classes to act as a service within a worker
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

// import JSProvider from "../providers/jsprovider.mjs";    -> needs polyfills, import dynamic

const scope = self;
let currentreq;

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

    async handleRequest(req) {
        currentreq = req;
        try {
            switch (req.cmd) {
                case 'get':
                    await this.get(req);
                    break;
                case 'set':
                    await this.set(req);
                    break;
                case 'invoke':
                    await this.invoke(req);
                    break;
                case 'subscribe':
                    await this.subscribe(req);
                    break;
                case 'unsubscribe':
                    await this.unsubscribe(req);
                    break;
                case 'querySchema':
                    await this.querySchema(req);
                    break;
                case 'use':
                    // use the url to instantiate the
                    await this.use(req);
                    break;
            }
        } catch (e) {
             this.handleError(e);
        }
    }

    handleError(e, info) {
        this.respond(currentreq, { error: 500, msg: e.message ? e.message : e, stack: e.stack ? e.stack : e.message, info });
    }

    respond(req, msg) {
        const res = { resid: req.resid, ...msg };
        this.port.postMessage(res);
    }

    async use(req) {
        if (this.provider) return;  // was already established (SharedWorker)
        const JSProvider = (await import('../providers/jsprovider.mjs')).default;
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



// now connect
onconnect = (evt) => {
    const port    = evt.ports[0];  // get the port
    const service = WorkerServiceImpl.at(port);
    // scope.onerror  = (message, source, lineno, colno, error) => service.handleError(error, { message, source, lineno, colno });  // this works because the worker itself is single threaded. refactor it this changes
    scope.addEventListener('error', (evt) => service.handleError(evt));
}
