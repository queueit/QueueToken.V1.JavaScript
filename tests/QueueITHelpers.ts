import {expect} from 'chai';
import {Utils} from "../src/QueueITHelpers";

describe('padRight', ()=>{
    it('should pad single characters to the right', ()=>{
        let padded = Utils.padRight("55", '0', 4);

        expect(padded).to.be.equal("5500")
    })
})
