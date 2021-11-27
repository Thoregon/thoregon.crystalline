/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import ServiceProvider from "./serviceprovider.mjs";
import JSInspector     from "../jsinspector.mjs";
import AccessObserver  from "/evolux.universe/lib/accessobserver.mjs";
import NullLogger      from "../nulllogger.mjs";

export default class JSProvider extends ServiceProvider {

    static with(obj) {
        const provider = new this();
        provider.obj = AccessObserver.observe(obj);
        return provider;
    }

    //
    // Provider Implementation
    //

    async connect(facade) {
        this._facade = facade;
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
        if (this._subsription) return false;
        this._subsription = (...evt) => handler(...evt);
        this.obj.addEventListener(name, handler);
        return true;
    }

    async unsubscribe(name) {
        if (!this._subsription) return;
        this.obj.removeEventListener(name, this._subsription);
    }

    async querySchema() {
        if (this._schema) return this._schema;
        this._schema = JSInspector.schemaFrom(this.obj);
        return this._schema;
    }


}
