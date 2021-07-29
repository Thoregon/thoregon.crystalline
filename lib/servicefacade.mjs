/**
 * a service facade delivers an easy to use interface
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
 * todo [REFACTOR]
 *  - use class builder to create a subclass from the service facade
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

const ISDEV = (globalThis.thoregon) ? thoregon.isDev : false;
const SERVICE_TIMEOUT = 2000;   // milliseconds

let i = 0;


export default class ServiceFacade {

    constructor() {
        this.timeout        = SERVICE_TIMEOUT;
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
     * @return {Promise<ServiceFacade>}
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

    /*async*/ _request(fn) {
        return new Promise(async (resolve, reject) => {
            let wasTimeout = false;
            const watchdog = ISDEV
                ? undefined
                : setTimeout(() => {
                    wasTimeout = true;
                    reject({ err: 'service timeout' });
                }, this.timeout);
            try {
                const result = await fn();
                if (!wasTimeout) resolve(result);       // check if the request exists (no timeout)
            } catch (e) {
                if (!wasTimeout) reject(e);             // check if the request exists (no timeout)
            } finally {
                if (watchdog) clearTimeout(watchdog);
            }
        });
    }

    //
    // generic API invocation
    //

    async get(property) {
        const result = await this._request( () => this.provider.get(property, i));
        return result;
    }

    async set(property, value) {
        await this._request(() => this.provider.set(property, value));
        return this;
    }

    async invoke(name, ...args) {
        const result = await this._request(() => this.provider.invoke(name, args));
        return result;
    }

    async subscribe(name, handler) {
        await this._request(() => this.provider.subscribe(name, (evt) => handler(evt)));
        return this;
    }

    async unsubscribe(name) {
        await this._request(() => this.provider.unsubscribe(name));
        return this;
    }
}
