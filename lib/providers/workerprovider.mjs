/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import ServiceProvider from "./serviceprovider.mjs";

export default class WorkerProvider extends ServiceProvider {

    static with(workerurl) {
        const provider = new this();
        provider._worker = new Worker(workerurl);
        return provider;
    }


    async connect(facade) {
        this._facade = facade;
        this._worker.port.start();
    }


}
