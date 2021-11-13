/**
 * Implement a request/response Q bridge to a async or remote service
 *
 * Provider on client side
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import RemoteProvider  from "./remoteprovider.mjs";

export default class ThoregonProvider extends RemoteProvider {

    constructor(root, allowedkeys) {
        super();
        Object.assign(this, { srvroot: root, allowedkeys })
    }

    static at(root, allowedkeys) {
        const provider = new this(root, allowedkeys);
        return provider;
    }

    //
    // RemoteProvider Implementation
    //

    sendRequest(msg) {

    }

    getResponse(evt) {
        return evt.data;
    }

    //
    // Provider Implementation
    //

    async connect(facade) {
        this._facade = facade;

        this.queueroot = universe.random();

        // read from service terminal the producers public key and the meta information (entry)
        //  public Q: entry is not encrypted
        //  restricted Q: entry is encrypted, consumer needs a credential
        // write a request for a new Q to a random property
        //  request contains the consumers pub key and an 'address' where the Q should be established
        //  consumer listens to Q
        //  request is encrypted with a shared secret (DH)
        // producer decrypts and checks if the request is valid
        //  producer answers with an initial response to the Q
        //  response is encrypted with a shared secret
        //  producer listens to Q
        // consumer posts an encrypted request to the Q
        // producer answers immediately a status (encrypted)
        //   producer can update the status while processing
        //   producer answers a response (encrypted)
        // consumer reads response
        // consumer now can close the Q after all requests

/*
        const queue = universe.archetim.persistenceRoot[this.queueroot];
        this.queue = queue;
        queue.on(evt => this.handleResponse(evt));

        const service = universe.archetim.persistenceRoot[this.srvroot];
        this.service = service;
*/

        await this.remoteRequest({ cmd: 'connect', where: this.queueroot });
    }




}
