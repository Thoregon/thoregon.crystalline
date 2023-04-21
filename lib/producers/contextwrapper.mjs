/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { NodeVM } from "/vm2";

export default class ContextWrapper {

    constructor(consumer, context) {
        this.consumer = consumer;
        this.context  = { ...context, consumer };
        this.vm       =  new NodeVM({
                                        console         : 'redirect',
                                        require         : {
                                            external: true,
                                            builtin : ['fs'],
                                            root    : './',
                                        },
                                        wrapper         : 'module',
                                        sourceExtensions: ['js', 'jsx'],
                                        compiler        : 'javascript',
                                        preload         : false,
                                        sandbox         : this.context,
                                    });
    }

    //
    // Provider Implementation
    //

    async connect() {
        await this.vm.run(``); this.consumer.connect();
    }

    async get(property) {
        await this.vm.run(``);
        return Reflect.get(this.obj, property);
    }

    async set(property, value) {
        await this.vm.run(``);
        Reflect.set(this.obj, property, value);
    }

    async invoke(name, ...args) {
        await this.vm.run(`return consumer.invoke(`);
        return await Reflect.apply(Reflect.get(this.obj, name), this.obj, ...args);
    }

    async subscribe(name, handler) {
        return this.consumer.subscribe(name, handler);
    }

    async unsubscribe(name) {
        return this.consumer.unsubscribe(name);
    }

    async querySchema() {
        return this.consumer.querySchema();
    }

}
