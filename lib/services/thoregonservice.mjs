/**
 *
 * Service on Implementation side
 *
 * establish a Sink (KeyedCollection) where others can
 * request a request/response Q
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import ServiceImpl from "./serviceimpl.mjs";

export default class ThoregonService extends ServiceImpl {

    static async with(root, service) {

    }

    async bind(root, service) {

    }

    async handleConnect(evt) {
        // get the queue at the specified address
        // set the listener
    }


}
