/**
 * don't log anything, default behavior
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class NullLogger {

    /**
     * log the request/response or a timeout
     *
     * @param {Object} req  request with payload
     * @param {Object} res  response with payload
     */
    request(req, res) {}

    /**
     * log emitted events for subscriptions
     *
     * @param {Object} evt
     */
    emit(evt) {}

}
