/**
 * a facade delivers an easy to use interface
 * to mostly remote services, or services which are behind
 * a process/memory context boundary
 *
 * the consumer doesn't need to know how to access the service
 * he gets an async JS API to the service
 *
 * services can provide
 *  - request/response functions
 *  - access to remote properties
 *  - as well as subscriptions for events
 *
 * the facade builds and provides an API based on the specified schema
 * the schema can either be provided when the facade is created,
 * or it tries to request it from the provider.
 *
 * however, if no schema is available, the generic API can be used:
 * - invoke(methodname, ...params)
 * - get(propertyname)
 * - set(propertyname, value)
 * - subscribe(eventname, handlerfn)
 * - unsubscribe(eventname)
 *
 * there can only be one handlerfn per subscription (event)!
 *
 * all API methods are async, to use it use 'await'.
 * also properties will return a promise. to get the value
 * use:
 *
 *  let value = await facade.property
 *
 * for subscriptions there is also an 'on<evtname>' property available where
 * a handlerfn can be assigned. use either 'subscribe' or 'on...'
 *
 *  the timeout by default is 2000ms. however it can
 *  be changed by 'srvfacade.timeout = 1000'.
 *  timeout use milliseconds
 *
 * todo
 *  - [OPEN]     secure logging layer; logger must be signed and be referenced in 'thoregon' to be used
 *  - [OPEN]     authentication & authorization for the service
 *  - [REFACTOR] use class builder to create a subclass from the facade
 *  - [OPEN]     mutiple services in service worker (but not until service worker type=module is available)
 *  - [OPEN]     mixins of multiple services in one facade
 *  - [OPEN]     Framework for: MessageQ, ThoregonQ
 *  - [OPEN]     Frameworks for: REST (OpenAPIs, AsyncAPI), GraphQL
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import NullLogger    from "./nulllogger.mjs";

const SERVICE_TIMEOUT = 2000;   // milliseconds

const ISDEV  = (globalThis.thoregon) ? thoregon.isDev : false;

let i = 0;


export default class Facade {

    constructor() {
        this.timeout = SERVICE_TIMEOUT;
        this.logger  = (globalThis.thoregon && thoregon.archetimlogger) ? thoregon.archetimlogger : new NullLogger();
    }

    /**
     * create a service API according to a schema
     * @param provider
     * @param [schema]  if an API schema is known use it immediately
     */
    static async use(provider, schema) {
        const facade = new this();
        await facade.connect(provider);
        await facade._constructAPI(schema);
        return facade;
    }

    /**
     * use a provider which implements the service
     * or the remote calls to the service
     * @param provider
     * @return {Promise<Facade>}
     */
    async connect(provider) {
        this.provider = provider;
        await provider.connect(this);
        return this;
    }

    async _constructAPI(schema) {
        // if no schema provided try to query it
        schema = schema || await this.provider.querySchema();
        const items = {};
        //  properties
        Object.entries(schema.properties).forEach(([name, spec]) => {
            items[name] = {
                configurable: false,
                enumerable: true,
                get: () => this.get(name),
                set: (value) => this.set(name, value)
            }
        })
        // methods
        Object.entries(schema.methods).forEach(([name, spec]) => {
            items[name] = {
                configurable: false,
                enumerable: true,
                writeable: false,
                value: async (...args) => await this.invoke(name, ...args)
            }
        })
        // events
        Object.entries(schema.events).forEach(([name, spec]) => {
            const hookname = `on${name}`;
            items[hookname] = {
                configurable: false,
                enumerable: true,
                set: (handler) => this.subscribe(name, handler)
            }
        })

        Object.defineProperties(this, items);
    }

    /*async*/ _request(req, fn) {
        return new Promise(async (resolve, reject) => {
            let wasTimeout = false;
            const watchdog = ISDEV
                ? undefined
                : setTimeout(() => {
                    wasTimeout = true;
                    try { this.logger.request(req, { err: 'service timeout' }) } catch (ignore) { console.log('Service Logger seems to be defect', ignore) };
                    reject({ err: 'service timeout' });
                }, this.timeout);
            try {
                const result = await fn();
                if (!wasTimeout) {
                    try { this.logger.request(req, result != undefined ? { result } : undefined) } catch (ignore) { console.log('Service Logger seems to be defect', ignore) };
                    resolve(result);
                }
            } catch (err) {
                if (!wasTimeout) {
                    try { this.logger.request(req, { err }) } catch (ignore) { console.log('Service Logger seems to be defect', ignore) };
                    reject(err);
                }
            } finally {
                if (watchdog) clearTimeout(watchdog);
            }
        });
    }

    _emit(evt, handler) {
        try { this.logger.emit(evt) } catch (ignore) {};
        handler(evt);
    }

    //
    // generic API invocation
    //

    async get(property) {
        const result = await this._request( { req: 'get', property }, () => this.provider.get(property, i));
        return result;
    }

    async set(property, value) {
        await this._request({ req: 'set', property, value }, () => this.provider.set(property, value));
        return this;
    }

    async invoke(name, ...args) {
        const result = await this._request({ req: 'invoke', name, args }, () => this.provider.invoke(name, args));
        return result;
    }

    async subscribe(name, handler) {
        await this._request({ req: 'subscribe', name }, () => this.provider.subscribe(name, (evt) => this._emit(evt, handler)));
        return this;
    }

    async unsubscribe(name) {
        await this._request({ req: 'unsubscribe', name }, () => this.provider.unsubscribe(name));
        return this;
    }

    async close() {
        await this._request({ req: 'close', name }, () => this.provider.close(name));
        return this;
    }
}
