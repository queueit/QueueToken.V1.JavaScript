import {expect} from "chai";
import {IEnqueueTokenPayload, Payload} from "../src/Payload";
import {Utils} from "../src/QueueITHelpers";

describe('Enqueue token payload', function () {
    it('should be able to generate a simple payload', () => {
        let expectedKey: string = "myKey";

        let instance: IEnqueueTokenPayload = Payload
            .Enqueue()
            .WithKey(expectedKey)
            .Generate();
        let actualKey: string = instance.Key;
        let actualCustomData = instance.CustomData;

        expect(actualKey).to.be.equal(expectedKey);
        expect(instance.RelativeQuality).to.be.undefined;
        expect(actualCustomData).to.not.be.null;
        expect(Object.keys(actualCustomData).length).to.be.equal(0);
        expect(instance.CustomData["key"]).to.be.undefined;
    });

    it('should be able to generate a payload with key and relative quality', () => {
        let expectedKey = "myKey";
        let expectedRelativeQuality = 0.456;

        let instance = Payload
            .Enqueue()
            .WithKey(expectedKey)
            .WithRelativeQuality(expectedRelativeQuality)
            .Generate();
        let actualKey = instance.Key;
        let actualRelativeQuality = instance.RelativeQuality;
        let actualCustomData = instance.CustomData;

        expect(actualKey).to.be.equal(expectedKey);
        expect(actualRelativeQuality).to.be.equal(expectedRelativeQuality);
        expect(actualCustomData).to.not.be.null;
        expect(Object.keys(actualCustomData).length).to.be.equal(0);
        expect(instance.CustomData["key"]).to.be.undefined;
    });

    it('should be able to generate a payload with relative quality and custom data', () => {
        const expectedKey = "myKey";
        const expectedRelativeQuality = 0.456;
        const expectedCustomDataValue = "Value";

        const instance = Payload
            .Enqueue()
            .WithKey(expectedKey)
            .WithRelativeQuality(expectedRelativeQuality)
            .WithCustomData("key", expectedCustomDataValue)
            .Generate();
        const actualKey = instance.Key;
        const actualRelativeQuality = instance.RelativeQuality;
        const actualCustomData = instance.CustomData["key"];

        expect(actualKey).to.be.equal(expectedKey);
        expect(actualRelativeQuality).to.be.equal(expectedRelativeQuality);
        expect(actualCustomData).to.be.equal(expectedCustomDataValue);
    });

    it('should be able to generate a payload with relative quality', () => {
        const expectedRelativeQuality = 0.456;

        const instance = Payload
            .Enqueue()
            .WithRelativeQuality(expectedRelativeQuality)
            .Generate();
        const actualKey = instance.Key;
        const actualRelativeQuality = instance.RelativeQuality;
        const actualCustomData = instance.CustomData;

        expect(actualKey).to.be.undefined;
        expect(actualRelativeQuality).to.be.equal(expectedRelativeQuality);
        expect(actualCustomData).to.not.be.undefined;
        expect(Object.keys(actualCustomData).length).to.be.equal(0);
    });

    it('should be able to generate a payload with relative quality and custom data 2', () => {
        const expectedRelativeQuality = 0.456;
        const expectedCustomDataValue = "Value";

        const instance = Payload
            .Enqueue()
            .WithRelativeQuality(expectedRelativeQuality)
            .WithCustomData("key", expectedCustomDataValue)
            .Generate();
        const actualKey = instance.Key;
        const actualRelativeQuality = instance.RelativeQuality;
        const actualCustomData = instance.CustomData["key"];

        expect(actualKey).to.be.undefined;
        expect(actualRelativeQuality).to.be.equal(expectedRelativeQuality);
        expect(actualCustomData).to.be.equal(expectedCustomDataValue);
    });

    it('should be able to generate a payload only with custom data', () => {
        const expectedCustomDataValue = "value";

        const instance = Payload
            .Enqueue()
            .WithCustomData("key", expectedCustomDataValue)
            .Generate();
        const actualKey = instance.Key;
        const actualRelativeQuality = instance.RelativeQuality;
        const actualCustomData = instance.CustomData["key"];

        expect(actualKey).to.be.undefined;
        expect(actualRelativeQuality).to.be.undefined;
        expect(actualCustomData).to.be.equal(expectedCustomDataValue);
    });

    it('should serialize key with relative quality and multiple custom data', () => {
        const expectedJson = "{\"r\":0.456,\"k\":\"myKey\",\"cd\":{\"key1\":\"Value1\",\"key2\":\"Value2\",\"key3\":\"Value3\"}}";

        const instance = Payload
            .Enqueue()
            .WithKey("myKey")
            .WithRelativeQuality(0.456)
            .WithCustomData("key1", "Value1")
            .WithCustomData("key2", "Value2")
            .WithCustomData("key3", "Value3")
            .Generate();
        const actualJson = Utils.uint8ArrayToString(instance.Serialize());

        expect(actualJson).to.be.equal(expectedJson);
    });

    it('should serialize key relative quality and one custom data', () => {
        const expectedJson = "{\"r\":0.456,\"k\":\"myKey\",\"cd\":{\"key1\":\"Value1\"}}";

        const instance = Payload
            .Enqueue()
            .WithKey("myKey")
            .WithRelativeQuality(0.456)
            .WithCustomData("key1", "Value1")
            .Generate();
        const actualJson = Utils.uint8ArrayToString(instance.Serialize());

        expect(actualJson).to.be.equal(expectedJson);
    });

    it('should serialize key and relative quality', () => {
        const expectedJson = "{\"r\":0.456,\"k\":\"myKey\"}";

        const instance = Payload
            .Enqueue()
            .WithKey("myKey")
            .WithRelativeQuality(0.456)
            .Generate();
        const actualJson = Utils.uint8ArrayToString(instance.Serialize());

        expect(actualJson).to.be.equal(expectedJson);
    });

    it('should serialize key only', () => {
        const expectedJson = "{\"k\":\"myKey\"}";

        const instance = Payload
            .Enqueue()
            .WithKey("myKey")
            .Generate();
        const actualJson = Utils.uint8ArrayToString(instance.Serialize());

        expect(actualJson).to.be.equal(expectedJson);
    });

    it('should serialize key only escaped', () => {
        const expectedJson = "{\"k\":\"my\\\"Key\"}";

        const instance = Payload
            .Enqueue()
            .WithKey("my\"Key")
            .Generate();
        const actualJson = Utils.uint8ArrayToString(instance.Serialize());

        expect(actualJson).to.be.equal(expectedJson);
    });

    it('should serialize relative quality only', () => {
        const expectedJson = "{\"r\":0.456}";

        const instance = Payload
            .Enqueue()
            .WithRelativeQuality(0.456)
            .Generate();
        const actualJson = Utils.uint8ArrayToString(instance.Serialize());

        expect(actualJson).to.be.equal(expectedJson);
    });

    it('should serialize custom data only', () => {
        const expectedJson = "{\"cd\":{\"key1\":\"Value1\"}}";

        const instance = Payload
            .Enqueue()
            .WithCustomData("key1", "Value1")
            .Generate();
        const actualJson = Utils.uint8ArrayToString(instance.Serialize())

        expect(actualJson).to.be.equal(expectedJson);
    });

    it('should serialize custom data escaped', () => {
        const expectedJson = "{\"cd\":{\"ke\\\"y1\":\"Va\\\"lue1\"}}";

        const instance = Payload
            .Enqueue()
            .WithCustomData("ke\"y1", "Va\"lue1")
            .Generate();
        const actualJson = Utils.uint8ArrayToString(instance.Serialize());

        expect(actualJson).to.be.equal(expectedJson);
    });

    it('should be encrypted correctly', () => {
        const expectedEncryptedPayload = "0rDlI69F1Dx4Twps5qD4cQrbXbCRiezBd6fH1PVm6CnVY456FALkAhN3rgVrh_PGCJHcEXN5zoqFg65MH8WZc_CQdD63hJre3Sedu0-9zIs";
        const payload = Payload
            .Enqueue()
            .WithKey("somekey")
            .WithRelativeQuality(0.45678663514)
            .WithCustomData("color", "blue")
            .WithCustomData("size", "medium")
            .Generate();
        const identifier = "a21d423a-43fd-4821-84fa-4390f6a2fd3e";
        const secretKey = "5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6";

        const actualEncryptedPayload = payload.EncryptAndEncode(secretKey, identifier);

        expect(actualEncryptedPayload).to.be.equal(expectedEncryptedPayload);
    })
});
