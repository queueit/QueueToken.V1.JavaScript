import {expect} from 'chai';
import {Utils} from "../../src/QueueITHelpers";
import {md5} from "../../src/helpers/Md5";

describe('md5 hashing', () => {
    it('should hash ascii text', () => {
        const md5hash: Uint8Array = md5(Utils.stringToUint8Array("some text"));

        expect(Utils.uint8ArrayToHexString(md5hash)).to.be.equal("552e21cd4cd9918678e3c1a0df491bc3");
    });

    it('should hash utf-8 text', () => {
        const md5hash: Uint8Array = md5(Utils.stringToUint8Array("ሰማይ አይታረስ ንጉሥ አይከሰስ።"));

        expect(Utils.uint8ArrayToHexString(md5hash)).to.be.equal("67a65157fd7b9d52409d762cfc7a2309");
    });
})
