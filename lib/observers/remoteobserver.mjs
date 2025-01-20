/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import AccessObserver, { isPrivateProperty, getAllMethodNames } from "/evolux.universe/lib/accessobserver.mjs";
import { isArray, isString, isObject, isDate,  }                                    from "/evolux.util/lib/objutils.mjs";
import { timeout }                                              from "/evolux.universe";

import MetaClass      from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import murmurhash3    from "/thoregon.archetim/lib/murmurhash.mjs";
import PromiseChain   from "/thoregon.archetim/lib/promisechain.mjs";

const MURMUR_SEED               = 7577308388235833;

const AGENT = 'sa'

const ANY_METACLASS = MetaClass.any();

const KNOWN_ENTITIES = new Map();

let REMOTE_SERVICE;

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
export const isThoregon = (obj) => obj && !!obj.$thoregon;

const NON_ENUMERABLE = new Set(['metaclass', 'metaClass']);
const nonEnumerable  = (property) => NON_ENUMERABLE.has(property);

let remotedecoratorprops = [], remotedecoratormethods = [];

let waitQ;

export default class RemoteObserver extends AccessObserver {

    constructor(target, { soul, handle, refs, meta, methodNames, accessorNames } = {}) {
        super(target, { soul, handle, refs, meta, methodNames, accessorNames });
        // const target     = args[0];
        // const opt        = args[1];

        this.target        = target;
        this.refs          = refs;
        this.meta          = meta;
        this.methodNames   = methodNames;
        this.accessorNames = accessorNames;

        this._soul         = soul ?? universe.random();
        this._handle       = handle ?? murmurhash3(this._soul,MURMUR_SEED) ?? undefined;

        this._buildRemoteMethods();
    }

    static from(soul) {
        debugger;
    }

    static /*async*/ find(soul) {
        const { proxy, chain } = PromiseChain.with(async (resolve, reject) => {
            if (KNOWN_ENTITIES.has(soul)) {
                resolve(KNOWN_ENTITIES.get(soul));
                return;
            }
            const srv = await this.__getRemoteService__();
            const obj = await srv.getEntity(soul);
            if (obj) {
                // srv.subscribe('change', (evt) => proxy.entityChanged(evt), { soul });
                resolve(obj);
            } else {
                resolve(undefined);
            }
        });
        return proxy;
    }

    static recreate(soul, obj, refs, opt) {
        // this object comes from remote and therefore exists
        if (KNOWN_ENTITIES.has(soul)) return KNOWN_ENTITIES.get(soul);
        const proxy = super.observe(obj, { ...opt, refs, soul });
        KNOWN_ENTITIES.set(soul, proxy);
        // this.addChangeListener(proxy);
        return proxy;
    }

    static knownEntities() {
        return KNOWN_ENTITIES;
    }

    //
    // meta
    //

    get soul() {
        return this._soul;
    }

    get handle() {
        const hdl = parseInt(this._handle);
        return !isNaN(hdl) ? hdl : murmurhash3(this._soul,MURMUR_SEED);
    }

    has(target, key) {
        return Reflect.has(target, key) || this.refs.hasOwnProperty(key); // key in target;
    }


    get $keys() {
        const keys = [...new Set([...Reflect.ownKeys(this.target), ...Object.keys(this.refs ?? {})])].filter((name) => !isPrivateProperty(name));
        return keys;
    }

    get keySet() {
        return this.$keys;
    }

    isEnumerable(name) {
        if (isPrivateProperty(name) || nonEnumerable(name)) return false;     // no symbols are emumerable
        if (!isArray(this.target) && name === 'length') return false;
        return true;
        // let propertySpec = this.metaClass$.getAttribute(name) ?? { enumerable : !isPrivateProperty(name) }; // if no property spec skip it in enumerations
        // return !isTimestamp(name) || propertySpec.enumerable;
    }

    isDecoratedProperty(name) {
        // override by subclasses when needed
        return remotedecoratorprops.includes(name) || super.isDecoratedProperty(name);
    }

    isDecoratedMethod(name) {
        // override by subclasses when needed
        return remotedecoratormethods.includes(name) || super.isDecoratedProperty(name);
    }

    $remote() {
        return true;
    }

    //
    // accessors
    //

    doGet(target, prop, receiver, opt = {}) {
        if (this.accessorNames?.includes(prop)) {
            const { proxy, chain } = PromiseChain.with(async (resolve, reject) => {
                try {
                    const srv = await this.__getRemoteService__();
                    const res = await srv.getEntityProperty(this.soul, prop);
                    resolve(res);
                } catch (e) {
                    reject(e);
                }
            });
            return proxy;
        }
        const val = Reflect.get(target, prop, receiver);
        if (val != undefined) return val;
        if (!this.refs[prop]) return;
        const { proxy, chain } = PromiseChain.with(async (resolve, reject) => {
            try {
                const soulref = this.refs[prop];
                const propobj = await RemoteObserver.find(soulref);
                if (!propobj) {
                    resolve(undefined);
                    return;
                }
                Reflect.set(target, prop, propobj);
                resolve(propobj);
            } catch (e) {
                reject(e);
            }
        }, undefined, receiver);
        return proxy;
    }

    doSet(target, prop, value, receiver, opt = {}) {
        // todo [REFACTOR]
        if (this.refs[prop]) {
            if (!isObject(value)) return false;
            let tgtobj = target[prop];
            if (tgtobj === undefined) {
                (async () => {
                    tgtobj = await Reflect.get(target, prop, receiver);
                    if (!tgtobj) return false;
                    Object.assign(tgtobj, value);
                })()
            } else {
                // apply properties
                Object.assign(tgtobj, value);
            }
        } else {
            Reflect.set(target, prop, value/*, receiver*/);
            (async () => {
                const srv = await this.__getRemoteService__();
                srv.setEntityProperty(this.soul, prop, value);
            })()
        }
        return true;
    }

    doDelete(target, prop, receiver, opt = {}) {
        Reflect.deleteProperty(target, prop);
        (async () => {
            const srv = await this.__getRemoteService__();
            srv.deleteEntityProperty(this.soul, prop);
        })()
    }

    //
    // iterator
    //

    /*
     *  iterator interface
     */
    *[Symbol.iterator]() {
        const keys = this.$keys;
        for (const key of keys) {
            const value = this.get(key);
            yield [key, value];
        }
    }

    /*
     * async iterator interface
     */
    async *[Symbol.asyncIterator]() {
        const keys = this.$keys;
        for await (const key of keys) {
            const value = await this.get(key);
            // yield value;
            yield [key, value];
        }
    }

    //
    // events
    //

    static handleDeepChange(evt) {
        // console.log("-- RemoteObserver::handleDeepChange", evt);
        const { remotesoul:soul, property, newValue, oldValue } = evt;
        if (!soul || !property) return;
        const entity = KNOWN_ENTITIES.get(soul);
        if (!entity) return;
        if (isString(newValue) && newValue?.startsWith("@soul")) {
            debugger;
        } else {
            const oldValue = this.primitiveGet(entity, property);
            // todo [OPEN]: check if same object?
            if (newValue === oldValue) return;
            this.primitiveSet(entity, property, newValue);
            if (!isPrivateProperty(property) && !entity.dontEmit(property)) {
                if (newValue == undefined) {
                    entity.emit('change', { type: 'delete', obj: entity, property, oldValue });
                } else {
                    entity.emit('change', { type: 'change', obj: entity, property, newValue, oldValue });
                }
            }
        }
    }

    static async addChangeListener(proxy) {
        const observer = proxy.$access;
        const srv = await this.__getRemoteService__();
        const soul = observer.soul;
        srv.subscribe('change', (evt) => observer.entityChanged(evt), { soul } );
    }

    entityChanged(evt) {
        if (this.soul !== evt.remotesoul) return;
        // console.log("-- RemoteObserver::entityChanged", evt);
        const property = evt.property;
        if (!property) return;
        if (evt.newValue?.startsWith("@soul")) {
            debugger;
1        } else {
            const target   = this.target;
            const receiver = this.proxy$;
            const current  = target[property];
            const oldValue = evt.oldValue;
            const newValue = evt.newValue;
            if (newValue === current) return;
            Reflect.set(target, property, newValue/*, receiver*/);
            if (!isPrivateProperty(property) && !this.dontEmit(property)) this.emit('change', { type: 'change', ...this.additionalEventParams(), obj: receiver, property, newValue, oldValue });
        }
    }

    dontEmit(prop) {
        return false;
    }

    addDeepListener(eventname, listener, options) {
        super.addDeepListener(eventname, listener, options);
    }

    //
    // internal
    //

    __clear__() {
        const target = this.target;
        Object.keys(target).forEach(key => delete target[key]);
        this.refs = {};
    }

    //
    // service
    //

    static /*async*/ __getRemoteService__() {
        return new Promise(async (resolve, reject) => {
            if (!REMOTE_SERVICE) {
                if (waitQ) {
                    waitQ.push(resolve);
                } else {
                    waitQ = [];
                    REMOTE_SERVICE = await app.current.services.remoteentity.consumer();
                    REMOTE_SERVICE.subscribe('deep-change', (evt) => this.handleDeepChange(evt));
                    resolve(REMOTE_SERVICE);
                    const q = waitQ;
                    waitQ = undefined;
                    for (const fn of q) {
                        fn(REMOTE_SERVICE);
                    }
                }
            } else {
                resolve(REMOTE_SERVICE);
            }
        });
    }

    async __getRemoteService__() {
        return this.constructor.__getRemoteService__();
    }

    //
    // remote methods
    //

    _buildRemoteMethods() {
        const methodNames = this.methodNames ?? [];
        const target = this.target;
        methodNames.forEach((methodName) => {
            const remoteMethod = (...args) => {
                // enable local implementations for some dedicated objects
                const localres = target[methodName]?.(this, ...args);
                const { done, params } = localres ?? { done: false, params: args };
                if (done) {
                    return params;
                } else {
                    let res = this._invokeRemoteMethod(target, methodName, params ?? args);
                    res = target[`${methodName}_done`]?.(res) ?? res;
                    return res;
                }
            }
            this._mths[methodName] = remoteMethod;
            // target[methodName] = remoteMethod;
        })
    }

    _invokeRemoteMethod(target, name, args) {
        // console.log("$$ RemoteObserver method ", name, args);
        const { proxy, chain } = PromiseChain.with(async (resolve, reject) => {
            try {
                const srv = await this.__getRemoteService__();
                const res = await srv.invokeOnEntity(this.soul, name, args);
                resolve(res);
            } catch (e) {
                reject(e);
            }
        });
        return proxy;
    }

    //
    // overrides
    //

    startSyncTX() {}

    materialized() { return true }

    // don't override 'primitiveSet()'
}

//
//
//


const wsconnector = () => universe.wsconnector;
(async () => {
    // todo [REFACTOR]: remove timeout and check if required service is running on agent
    await timeout(1500);
    const ws = wsconnector();
    if (!ws) {
        // console.log(">> RemoteObserver WS not available");
        return;
    }
    await ws.whenConnected(AGENT);
    wsconnector().addListener(async (evt) => {
        if (evt.agent === AGENT && evt.state === 'opened') {
            await timeout(3600);
            const souls = KNOWN_ENTITIES.keys();
            for await (const soul of souls) {
                // update all entities
            }
        }
    });
})()

//
// globals
//

remotedecoratormethods = getAllMethodNames(RemoteObserver.prototype);

if (!Object.prototype.hasOwnProperty('$thoregon'))    Object.defineProperty(Object.prototype, '$thoregon', { configurable: false, enumerable: false, writable: false, value: undefined });
if (!Object.prototype.hasOwnProperty('$collection')) Object.defineProperty(Object.prototype, '$collection', { configurable: false, enumerable: false, writable: false, value: true });
