/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import ServiceConsumer from "./serviceconsumer.mjs";
import JSInspector     from "/thoregon.archetim/lib/reflect/jsinspector.mjs";
import AccessObserver  from "/evolux.universe/lib/accessobserver.mjs";
import NullLogger      from "../nulllogger.mjs";

export default class JSConsumer extends ServiceConsumer {

    static with(obj) {
        const provider = new this();
        provider.obj = AccessObserver.observe(obj);
        return provider;
    }

    //
    // Provider Implementation
    //

    async connect() {
    }

    async get(property) {
        return Reflect.get(this.obj, property);
    }

    async set(property, value) {
        Reflect.set(this.obj, property, value);
    }

    async invoke(name, ...args) {
        return await Reflect.apply(Reflect.get(this.obj, name), this.obj, ...args);
    }

    async subscribe(name, handler) {
        this.obj.addEventListener(name, handler);
        return true;
    }

    async unsubscribe(name, handler) {
        if (!handler) return;
        this.obj.removeEventListener(name, handler);
    }

    async querySchema() {
        if (this._schema) return this._schema;
        this._schema = JSInspector.schemaFrom(this.obj);
        return this._schema;
    }


}
