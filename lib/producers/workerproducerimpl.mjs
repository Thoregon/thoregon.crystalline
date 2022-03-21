/**
 * a wrapper for objects/classes to act as a service within a worker
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ProducerImpl from "./producerimpl.mjs";

// import JSConsumer from "../providers/jsconsumer.mjs";    -> needs polyfills, import dynamic

const scope = self;
let currentreq;

export default class WorkerProducerImpl extends ProducerImpl {

    constructor(port) {
        super();
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

    respond(req, msg) {
        const res = { resid: req.resid, ...msg };
        this.port.postMessage(res);
    }

}

// now connect
onconnect = (evt) => {
    const port    = evt.ports[0];  // get the port
    const service = WorkerProducerImpl.at(port);
    // scope.onerror  = (message, source, lineno, colno, error) => service.handleError(error, { message, source, lineno, colno });  // this works because the worker itself is single threaded. refactor it this changes
    scope.addEventListener('error', (evt) => service.handleError(evt));
}
