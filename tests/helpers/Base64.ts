import {expect} from 'chai';
import {Base64} from "../../src/helpers/Base64";
import {Utils} from "../../src/QueueITHelpers";

describe('Base64 encoding', () => {
    it('should encode normal ascii text', () => {
        const encoded = Base64.encode(Utils.stringToUint8Array("SomeText"));

        expect(encoded).to.not.be.null
        expect(encoded).to.equal("U29tZVRleHQ");
    });

    it('should encode utf-8 text', () => {
        const encoded = Base64.encode(Utils.stringToUint8Array("14.95 €"));

        expect(encoded).to.not.be.null
        expect(encoded).to.equal("MTQuOTUg4oKs");
    });

    it('should encode utf-8 text 2', () => {
        const encoded = Base64.encode(Utils.stringToUint8Array("⌷←⍳→⍴∆∇⊃‾⍎⍕⌈ 14.95 €"));

        expect(encoded).to.not.be.null
        expect(encoded).to.equal("4oy34oaQ4o2z4oaS4o204oiG4oiH4oqD4oC-4o2O4o2V4oyIIDE0Ljk1IOKCrA");
    });
})

describe('Base64 decoding', () => {
    it('should decode normal ascii text', ()=>{
        const decoded = Base64.decode("U29tZVRleHQ");

        expect(decoded).to.not.be.null;
        expect(Utils.uint8ArrayToString(decoded)).to.equal('SomeText');
        expect(decoded.length).to.be.equal(8);
    });

    it('should decode normal utf-8 text', ()=>{
        const decoded = Base64.decode("MTQuOTUg4oKs");

        expect(decoded).to.not.be.null;
        expect(Utils.uint8ArrayToString(decoded)).to.equal('14.95 €')
        expect(decoded.length).to.be.equal(9);
    });

    it('should decode normal utf-8 text 2', ()=>{
        const decoded = Base64.decode("4oy34oaQ4o2z4oaS4o204oiG4oiH4oqD4oC-4o2O4o2V4oyIIDE0Ljk1IOKCrA");

        expect(decoded).to.not.be.null;
        expect(Utils.uint8ArrayToString(decoded)).to.equal('⌷←⍳→⍴∆∇⊃‾⍎⍕⌈ 14.95 €')
        expect(decoded.length).to.be.equal(46);
    });
})
