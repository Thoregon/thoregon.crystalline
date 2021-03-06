/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class ConsoleLogger {

    constructor(name) {
        this.name = name ?? 'Consumer';
    }

    /**
     * log the request/response or a timeout
     *
     * @param {String} who
     * @param {Object} req  request with payload
     * @param {Object} res  response with payload
     */
    request(who, req, res) {
        this.log(who, 'request', { req, res });
    }

    /**
     * log emitted events for subscriptions
     *
     * @param {String} who
     * @param {Object} evt
     */
    emit(who, evt) {
        this.log(who, 'emit', evt);
    }

    /**
     * log any message
     *
     * @param {String} who
     * @param {String} type
     * @param {[Object]} msgs
     */
    log(who, type, ...msgs) {
        try {
            const msg = msgs.map(item => item != undefined ? (typeof item === 'object' ? JSON.stringify(item) : item.toString()) : '').join(' ');
            console.log(`# ${who}>>${type ?? 'log'}`, msg);
        } catch (e) { console.log("Error during log", who, type, msgs, e) }
    }

}
