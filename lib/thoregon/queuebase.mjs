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
        const pubkey = 'THOREGON';
        const encrypt = async ({ p, s, c, ...opt } = {}) => { return { p: p ?? pubkey, s, c, ...opt } };
        const decrypt = async ({ p, s, c } = {}) => c;

        return { encrypt, decrypt };
    }

    useCrypto({ encrypt, decrypt } = {}) {
        this.crypto = { encrypt, decrypt };
    }

    async getCrypto(opt) {
        return this.crypto ?? await this.constructor.getCrypto(opt);
    }

}
