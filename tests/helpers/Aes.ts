import {expect} from 'chai';
import {Utils} from "../../src/QueueITHelpers";
import {ModeOfOperationCBC} from "../../src/helpers/Aes";
import {Base64} from "../../src/helpers/Base64";

describe('AES CBC', () => {
    it('Should encrypt ascii text', () => {
        const keyBytes = Utils.stringToUint8Array("1234567890" +
            "1234567890" +
            "1234567890" +
            "12")// Utils.generateKey("someKey");
        const ivBytes = Utils.stringToUint8Array("1234567890123456"); // Utils.generateIV("someIV")
        const valueToEncrypt = Utils.stringToUint8Array("some text.");

        const aesCBC = new ModeOfOperationCBC(keyBytes, ivBytes);
        const encrypted: Uint8Array = aesCBC.encrypt(valueToEncrypt);

        expect(Base64.encode(encrypted)).to.be.equal('JMItZ2KiunOWZVLGkTQ5EQ');
    });

    it('Should decrypt ascii text', () => {
        const keyBytes = Utils.stringToUint8Array("1234567890" +
            "1234567890" +
            "1234567890" +
            "12")// Utils.generateKey("someKey");
        const ivBytes = Utils.stringToUint8Array("1234567890123456"); // Utils.generateIV("someIV")
        const valueToDecrypt = Base64.decode("JMItZ2KiunOWZVLGkTQ5EQ");

        const aesCBC = new ModeOfOperationCBC(keyBytes, ivBytes);
        const decrypted: Uint8Array = aesCBC.decrypt(valueToDecrypt);
        expect(Utils.uint8ArrayToString(decrypted)).to.be.equal('some text.');
    });
})
