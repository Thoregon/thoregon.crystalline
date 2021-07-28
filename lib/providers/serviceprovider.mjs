/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

let i = 0;

export default class ServiceProvider {

    constructor(props) {
    }

    //
    // implement by subclass
    //

    /**
     * connect to the service, if required do
     * also the authorization.
     */
    async connect(facade) {
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
