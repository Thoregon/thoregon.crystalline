/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class ConsoleLogger {

    /**
     * log the request/response or a timeout
     *
     * @param {Object} req  request with payload
     * @param {Object} res  response with payload
     */
    request(req, res) {
        console.log('# Service>>request', req, res != undefined ? res : '');
    }

    /**
     * log emitted events for subscriptions
     *
     * @param {Object} evt
     */
    emit(evt) {
        console.log('# Service>>emit', evt);
    }

}
