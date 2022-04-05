/**
 * Baseclass (Interface) to implement a service provider
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import NullLogger from "../nulllogger.mjs";

let i = 0;

export default class ServiceConsumer {

    constructor(props) {
    }

    //
    // implement by subclass
    //

    async connectFacade(facade, { timeout, logger } = {}) {
        this.timeout = timeout;
        this.logger  = logger ?? ((globalThis.thoregon && thoregon.archetimlogger) ? thoregon.archetimlogger : new NullLogger());
        this._facade = facade;
        await this.connect();
    }

    /**
     * connect to the service, if required do
     * also the authorization.
     */
    async connect() {
        // implement by subclass
    }

    async close() {
        // implement by subclass
    }

    async get(property) {
        // implement by subclass
    }

    async set(property, value) {
        // implement by subclass
    }

    async invoke(name, args) {
        // implement by subclass
    }

    async subscribe(name, handler) {
        // implement by subclass
    }

    async unsubscribe(name) {
        // implement by subclass
    }

    async querySchema() {
        // implement by subclass
    }
}
