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
        return this.obj[property];
    }

    async set(property, value) {
        this.obj[property] = value;
    }

    async invoke(name, args) {
        return await this.obj[name](...args);
    }

    async subscribe(name, handler) {
        this.obj.addEventListener(name, handler);
    }

    async unsubscribe(name, handler) {
        this.obj.removeEventListener(name, handler);
    }

    async querySchema() {
        if (this._schema) return this._schema;
        this._schema = JSInspector.schemaFrom(this.obj);
        return this._schema;
    }


}
