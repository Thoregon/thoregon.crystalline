/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
const EXCLUDEDPROPS = ['is_empty', 'constructor'];
const STOPCLS       = Object.getPrototypeOf({});

export default class JSInspector {

    static schemaFrom(obj) {
        const inspector = new this();
        // inspector._obj  = obj;
        const schema = inspector.inspect(obj);
        return schema;
    }

    inspect(obj) {
        const properties = Object.keys(obj); // this.getAllPropertyNames(obj);
        const methods    = this.getAllMethodNames(obj.constructor.prototype);
        const events     = [...properties];
        const schema     = {
            meta: {
                name: obj.constructor.name
            },
            properties: {},
            attributes: {},
            methods: {},
            events: {}
        };

        properties.forEach(prop => schema.properties[prop] = { type: 'any' });
        schema.events['mutation'] = { params: { event: { type: 'any' } } };     // todo: is an Event type
        methods.forEach(method => {
            const parameters = {};
            this.getFnParamNames(obj[method]).forEach(param => parameters[param] = { type: 'any' });
            schema.methods[method] = { parameters, return: { type: 'any' } };
        } );

        return schema;
    }

    getAllMethodNames(obj) {
        let cls   = obj.constructor.prototype;
        let props = [];

        while (cls && cls !== STOPCLS) {
            props = [...Object.getOwnPropertyNames(cls), ...props].unique();
            cls   = Object.getPrototypeOf(cls);
        };

        return props.filter(e => !EXCLUDEDPROPS.includes(e) && !e.startsWith('__'));
    }

    getFnParamNames(fn){
        const fstr = fn.toString();
        // this should be a standard reflection of javascript, as long as it does not exist use this regex
        return fstr.match(/\(.*?\)/)[0].replace(/[()]/gi,'').replace(/\s/gi,'').split(',').filter(name => !!name);
    }
}

