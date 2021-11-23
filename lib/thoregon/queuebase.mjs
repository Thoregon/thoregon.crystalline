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
        const encrypt = async (obj) => obj;
        const decrypt = async (obj) => obj;
        encrypt.pub = 'TERMINAL';
        decrypt.pub = 'TERMINAL';

        return { encrypt, decrypt };
    }

    async getCrypto(opt) {
        return await this.constructor.getCrypto(opt);
    }

}
