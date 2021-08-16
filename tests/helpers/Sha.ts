import {expect} from 'chai';
import {ShaHashing, Utils} from "../../src/QueueITHelpers";
import sha256 from "../../src/helpers/Sha";
import {Base64} from "../../src/helpers/Base64";

describe('sha256 hashing', () => {
    it('should hash ascii text', () => {
        let sha256Hash = sha256(Utils.stringToUint8Array("some text."));

        expect(Utils.uint8ArrayToHexString(sha256Hash)).to.be.equal("ec88666e7bd0815c742f4194064632980777823ef3f58d235f958c205284af27")
    });

    it('should hash long values', () => {
        const key = "5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6";
        const text = "eyJ0eXAiOiJRVDEiLCJlbmMiOiJBRVMyNTYiLCJpc3MiOjE1Mzc0MDE2MDAwMDAsImV4cCI6MTU0MTgwODAwMDAwMCwidGkiOiJhMjFkNDIzYS00M2ZkLTQ4MjEtODRmYS00MzkwZjZhMmZkM2UiLCJjIjoidGlja2V0YW5pYSIsImUiOiJteWV2ZW50IiwiaXAiOiI1LjcuOC42IiwieGZmIjoiNDUuNjcuMi40LDM0LjU2LjMuMiJ9.";

        const hashedValue = ShaHashing.GenerateHash(key, text);
        const base64Text = Base64.encode(hashedValue);

        expect(Utils.uint8ArrayToHexString(hashedValue)).to.be.equal("32bafc1c2af17afd86b931a414595220243526251282da1c68d75c59499dde73");
        expect(base64Text).to.be.equal("Mrr8HCrxev2GuTGkFFlSICQ1JiUSgtocaNdcWUmd3nM")
    })

    it('should hash utf-8 text', () => {
        let sha256Hash = sha256(Utils.stringToUint8Array("ᚻᛖ ᚳᚹᚫᚦ ᚦᚫᛏ ᚻᛖ ᛒᚢᛞᛖ ᚩᚾ ᚦᚫᛗ ᛚᚪᚾᛞᛖ ᚾᚩᚱᚦᚹᛖᚪᚱᛞᚢᛗ ᚹᛁᚦ ᚦᚪ ᚹᛖᛥᚫ"));

        expect(Utils.uint8ArrayToHexString(sha256Hash)).to.be.equal("387ac158cb9d70f6f44cf4db3630050f89b49e933f546c9009202658c42ce89e")
    });
})
