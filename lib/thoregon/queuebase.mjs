/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class QueueBase {

    // todo:
    //  - implement encrypt/decrypt as public sign/verifiy with the publishers keypair
    //  - private queue soruce with credentials

    static async getCrypto(opt) {
        // $@CRED
        // todo [OPEN]:
        //  - replace with real encryption and signing
        //  - private objects use the identities keys
        //  - shared objects use the keys from identities credentials
        const encrypt = async ({ pub, salt, payload } = {}) => { return { p: pub || this.pub, c: payload } };
        const decrypt = async ({ p, s, c } = {}) => c;
        encrypt.pub = 'THOREGON';
        decrypt.pub = 'THOREGON';

        return { encrypt, decrypt };
    }

    useCrypto({ encrypt, decrypt } = {}) {
        this.crypto = { encrypt, decrypt };
    }

    async getCrypto(opt) {
        return this.crypto ?? await this.constructor.getCrypto(opt);
    }

}
