/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class DocumentLogger {

    constructor(name, logelem, withconsole = true) {
        this.name        = name ?? 'Consumer';
        this.logelem     = logelem;
        this.withconsole = withconsole;
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
     * @param {Object} evt
     */
    log(who, type, ...msgs) {
        try {
            const msg = msgs.map(item => item != undefined ? (typeof item === 'object' ? JSON.stringify(item) : item.toString()) : '').join(' ');
            if (this.logelem) {
                const item = document.createElement('p');
                item.innerText = `# ${who}>>${type ?? 'log'} ` + msg;
                this.logelem.appendChild(item);
            }
            if (this.withconsole) console.log(`# ${who}>>${type ?? 'log'}`, ...msgs);
        } catch (e) { console.log("Error during log", who, type, msgs, e) }
    }

}
