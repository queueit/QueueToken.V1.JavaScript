/* eslint-disable sonarjs/no-duplicate-string */

import {expect} from "chai";
import {Payload} from "../src";
import {Utils} from "../src/QueueITHelpers";
import {EnqueueToken, Token} from "../src/Token";
import {TokenVersion} from "../src/model/TokenVersion";
import {EncryptionType} from "../src/model/EncryptionType";
import {HeaderDto} from "../src/model/HeaderDto";

describe('Enqueue Token', () => {
    it('should create a simple token', () => {
        const startTime = new Date(Utils.utcNow());
        const expectedCustomerId = "ticketania";
        const token = Token
            .Enqueue(expectedCustomerId)
            .Generate("5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");
        const endTime = new Date();

        expect(token.CustomerId).to.be.equal(expectedCustomerId);
        expect(token.TokenIdentifier).not.to.be.null
        expect(token.TokenVersion).to.be.equal(TokenVersion.QT1);
        expect(token.Encryption).to.be.equal(EncryptionType.AES256);
        expect(startTime <= token.Issued).to.be.true;
        expect(endTime >= token.Issued).to.be.true;
        expect(token.Expires.getTime()).to.be.equal(Utils.maxDate().getTime());
        expect(token.EventId).to.be.undefined;
        expect(token.Payload).to.be.undefined;
    });

    it('should create a token with identifier prefix', () => {
        const tokenIdentifierPrefix = "SomePrefix";

        const token = Token
            .Enqueue("ticketania", tokenIdentifierPrefix)
            .Generate("5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");

        const tokenIdentifierParts = token.TokenIdentifier.split("~");
        expect(tokenIdentifierParts[0]).to.be.equal(tokenIdentifierPrefix);
    });

    it('should create a token with validity as long', () => {
        const expectedValidity = 3000;

        const token = Token
            .Enqueue("ticketania")
            .WithValidity(expectedValidity)
            .Generate("5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");

        let expectedExpiry = new Date(token.Issued.getTime() + expectedValidity);
        expect(token.Expires.getTime()).to.be.equal(expectedExpiry.getTime());
    });

    it('should create a token with validity as date', () => {
        const expectedValidity = new Date(2030, 1, 1, 12, 0, 0);

        const token = Token
            .Enqueue("ticketania")
            .WithValidityDate(expectedValidity)
            .Generate("5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");

        expect(token.Expires.getTime()).to.be.equal(expectedValidity.getTime());
    });

    it('should create a token with event id', () => {
        const expectedEventId = "myevent";

        const token = Token
            .Enqueue("ticketania")
            .WithEventId(expectedEventId)
            .Generate("5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");

        expect(token.EventId).to.be.equal(expectedEventId);
    });

    it('should create a token with ip address', () => {
        const expectedIpAddress = "1.5.8.9";

        const expectedXForwardedFor = "45.67.2.4,34.56.3.2";
        const token = Token
            .Enqueue("ticketania")
            .WithIpAddress(expectedIpAddress, expectedXForwardedFor)
            .Generate("5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");

        expect(token.IpAddress).to.be.equal(expectedIpAddress);
        expect(token.XForwardedFor).to.be.equal(expectedXForwardedFor);
    });

    it('should create a token with payload', () => {
        const expectedPayload = Payload.Enqueue().WithKey("somekey").Generate();

        const token = Token
            .Enqueue("ticketania")
            .WithPayload(expectedPayload)
            .Generate("5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");

        expect(token.Payload).to.be.equal(expectedPayload);
    });

    it('should create token with payload key and relative quality', () => {
        const expectedEventId = "myevent";
        const expectedCustomerId = "ticketania";
        const expectedValidity = 1100;

        const expectedPayload = Payload
            .Enqueue()
            .WithKey("somekey")
            .Generate();

        const token = Token
            .Enqueue(expectedCustomerId)
            .WithPayload(expectedPayload)
            .WithEventId(expectedEventId)
            .WithValidity(expectedValidity)
            .Generate("5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");

        expect(token.CustomerId).to.be.equal(expectedCustomerId);
        expect(token.EventId).to.be.equal(expectedEventId);
        expect(token.Expires.getTime() - token.Issued.getTime()).to.be.equal(expectedValidity);
        expect(token.Payload).to.be.equal(expectedPayload);
    });

    it('should sign a token with payload and custom data', () => {
        const expectedSignedToken =
            "eyJ0eXAiOiJRVDEiLCJlbmMiOiJBRVMyNTYiLCJpc3MiOjE1MzQ3MjMyMDAwMDAsImV4cCI6MTUzOTEyOTYwMDAwMCwidGkiOiJhMjFkNDIzYS00M2ZkLTQ4MjEtODRmYS00MzkwZjZhMmZkM2UiLCJjIjoidGlja2V0YW5pYSIsImUiOiJteWV2ZW50In0.0rDlI69F1Dx4Twps5qD4cQrbXbCRiezBd6fH1PVm6CnVY456FALkAhN3rgVrh_PGCJHcEXN5zoqFg65MH8WZc_CQdD63hJre3Sedu0-9zIs.aZgzkJm57etFaXjjME_-9LjOgPNTTqkp1aJ057HuEiU";

        const payload = Payload
            .Enqueue()
            .WithKey("somekey")
            .WithRelativeQuality(0.45678663514)
            .WithCustomData("color", "blue")
            .WithCustomData("size", "medium")
            .Generate();

        const token = EnqueueToken.Create(
            "a21d423a-43fd-4821-84fa-4390f6a2fd3e",
            "ticketania",
            "myevent",
            new Date(Date.UTC(2018, 8 - 1, 20, 0, 0, 0, 0)),
            new Date(Date.UTC(2018, 10 - 1, 10, 0, 0, 0, 0)),
            null,
            null,
            payload);
        token.Generate("5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6", false);

        const actualSignedToken = token.Token;

        expect(actualSignedToken).to.be.equal(expectedSignedToken);
    });

    it('should serialize headers', () => {
        let expectedText = "eyJ0eXAiOiJRVDEiLCJlbmMiOiJBRVMyNTYiLCJpc3MiOjE1MzQ3MjMyMDAwMDAsImV4cCI6MTUzOTEyOTYwMDAwMCwidGkiOiJhMjFkNDIzYS00M2ZkLTQ4MjEtODRmYS00MzkwZjZhMmZkM2UiLCJjIjoidGlja2V0YW5pYSIsImUiOiJteWV2ZW50IiwiaXAiOiI1LjcuOC42IiwieGZmIjoiNDUuNjcuMi40LDM0LjU2LjMuMiJ9.";
        const dto = new HeaderDto();
        dto.CustomerId = "ticketania";
        dto.EventId = "myevent";
        dto.TokenIdentifier = "a21d423a-43fd-4821-84fa-4390f6a2fd3e";
        dto.Issued = Date.UTC(2018, 8 - 1, 20, 0, 0, 0, 0);
        dto.Expires = Date.UTC(2018, 10 - 1, 10, 0, 0, 0, 0);
        dto.Encryption = EncryptionType[EncryptionType.AES256];
        dto.TokenVersion = TokenVersion[TokenVersion.QT1];
        dto.IpAddress = "5.7.8.6"
        dto.XForwardedFor = "45.67.2.4,34.56.3.2";

        let serialized = dto.Serialize() + ".";

        expect(serialized).to.be.equal(expectedText);
    })

    it('should sign a token without payload', () => {
        const expectedSignedToken =
            "eyJ0eXAiOiJRVDEiLCJlbmMiOiJBRVMyNTYiLCJpc3MiOjE1MzQ3MjMyMDAwMDAsImV4cCI6MTUzOTEyOTYwMDAwMCwidGkiOiJhMjFkNDIzYS00M2ZkLTQ4MjEtODRmYS00MzkwZjZhMmZkM2UiLCJjIjoidGlja2V0YW5pYSIsImUiOiJteWV2ZW50IiwiaXAiOiI1LjcuOC42IiwieGZmIjoiNDUuNjcuMi40LDM0LjU2LjMuMiJ9..wUOdVDIKlrIqumpU33bShDPdvTkicRk3q4Z-Vs8epFc";

        const token = EnqueueToken.Create(
            "a21d423a-43fd-4821-84fa-4390f6a2fd3e",
            "ticketania",
            "myevent",
            new Date(Date.UTC(2018, 8 - 1, 20, 0, 0, 0)),
            new Date(Date.UTC(2018, 10 - 1, 10, 0, 0, 0)),
            "5.7.8.6",
            "45.67.2.4,34.56.3.2",
            null);
        token.Generate("5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6", false);

        const actualSignedToken = token.Token;

        expect(actualSignedToken).to.be.equal(expectedSignedToken);
    });

    it('should sign a token with minimal header', () => {
        const expectedSignedToken =
            "eyJ0eXAiOiJRVDEiLCJlbmMiOiJBRVMyNTYiLCJpc3MiOjE1MzQ3MjMyMDAwMDAsInRpIjoiYTIxZDQyM2EtNDNmZC00ODIxLTg0ZmEtNDM5MGY2YTJmZDNlIiwiYyI6InRpY2tldGFuaWEifQ..ChCRF4bTbt4zlOcvXLjQYouhgqgiNNNZqcci8VWoZIU";

        const token = EnqueueToken.Create(
            "a21d423a-43fd-4821-84fa-4390f6a2fd3e",
            "ticketania",
            null,
            new Date(Date.UTC(2018, 8 - 1, 20, 0, 0, 0, 0)),
            null,
            null,
            null,
            null);
        token.Generate("5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6", false);

        const actualSignedToken = token.Token;

        expect(actualSignedToken).to.be.equal(expectedSignedToken);
    });

    it('should parse a token without payload', () => {
        const hash = "wUOdVDIKlrIqumpU33bShDPdvTkicRk3q4Z-Vs8epFc";
        const token =
            "eyJ0eXAiOiJRVDEiLCJlbmMiOiJBRVMyNTYiLCJpc3MiOjE1MzQ3MjMyMDAwMDAsImV4cCI6MTUzOTEyOTYwMDAwMCwidGkiOiJhMjFkNDIzYS00M2ZkLTQ4MjEtODRmYS00MzkwZjZhMmZkM2UiLCJjIjoidGlja2V0YW5pYSIsImUiOiJteWV2ZW50IiwiaXAiOiI1LjcuOC42IiwieGZmIjoiNDUuNjcuMi40LDM0LjU2LjMuMiJ9.";
        const tokenString = token + "." + hash;

        const enqueueToken = Token.Parse(tokenString, "5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");

        expect(enqueueToken.TokenIdentifier).to.be.equal("a21d423a-43fd-4821-84fa-4390f6a2fd3e");
        expect(enqueueToken.CustomerId).to.be.equal("ticketania");
        expect(enqueueToken.EventId).to.be.equal("myevent");
        expect(enqueueToken.IpAddress).to.be.equal("5.7.8.6");
        expect(enqueueToken.XForwardedFor).to.be.equal("45.67.2.4,34.56.3.2");
        expect(enqueueToken.Expires.getTime()).to.be.equal(new Date(Date.UTC(2018, 10 - 1, 10, 0, 0, 0)).getTime());
        expect(enqueueToken.Issued.getTime()).to.be.equal(new Date(Date.UTC(2018, 8 - 1, 20, 0, 0, 0)).getTime());
        expect(enqueueToken.HashCode).to.be.equal(hash);
        expect(enqueueToken.TokenWithoutHash).to.be.equal(token);
        expect(enqueueToken.Token).to.be.equal(tokenString);
        expect(enqueueToken.Encryption).to.be.equal(EncryptionType.AES256);
        expect(enqueueToken.TokenVersion).to.be.equal(TokenVersion.QT1);
        expect(enqueueToken.Payload).to.be.undefined;
    });

    it('should parse a token with payload', () => {
        const hash = "aZgzkJm57etFaXjjME_-9LjOgPNTTqkp1aJ057HuEiU";
        const token =
            "eyJ0eXAiOiJRVDEiLCJlbmMiOiJBRVMyNTYiLCJpc3MiOjE1MzQ3MjMyMDAwMDAsImV4cCI6MTUzOTEyOTYwMDAwMCwidGkiOiJhMjFkNDIzYS00M2ZkLTQ4MjEtODRmYS00MzkwZjZhMmZkM2UiLCJjIjoidGlja2V0YW5pYSIsImUiOiJteWV2ZW50In0.0rDlI69F1Dx4Twps5qD4cQrbXbCRiezBd6fH1PVm6CnVY456FALkAhN3rgVrh_PGCJHcEXN5zoqFg65MH8WZc_CQdD63hJre3Sedu0-9zIs";
        const tokenString = token + "." + hash;

        const enqueueToken = Token.Parse(tokenString, "5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");

        expect(enqueueToken.TokenIdentifier).to.be.equal("a21d423a-43fd-4821-84fa-4390f6a2fd3e");
        expect(enqueueToken.CustomerId).to.be.equal("ticketania");
        expect(enqueueToken.EventId).to.be.equal("myevent");
        expect(enqueueToken.Expires.getTime()).to.be.equal(new Date(Date.UTC(2018, 10 - 1, 10, 0, 0, 0)).getTime());
        expect(enqueueToken.Issued.getTime()).to.be.equal(new Date(Date.UTC(2018, 8 - 1, 20, 0, 0, 0)).getTime());
        expect(enqueueToken.HashCode).to.be.equal(hash);
        expect(enqueueToken.TokenWithoutHash).to.be.equal(token);
        expect(enqueueToken.Token).to.be.equal(tokenString);
        expect(enqueueToken.Encryption).to.be.equal(EncryptionType.AES256);
        expect(enqueueToken.TokenVersion).to.be.equal(TokenVersion.QT1);
        expect(enqueueToken.Payload.Key).to.be.equal("somekey");
        expect(enqueueToken.Payload.RelativeQuality).to.be.equal(0.45678663514);
        expect(enqueueToken.Payload.CustomData["color"]).to.be.equal("blue");
        expect(enqueueToken.Payload.CustomData["size"]).to.be.equal("medium");
    });

    it('should parse a token with payload and no custom data', () => {
        const tokenString = "eyJ0eXAiOiJRVDEiLCJlbmMiOiJBRVMyNTYiLCJpc3MiOjE1MzQ3MjMyMDAwMDAsImV4cCI6MTUzOTEyOTYwMDAwMCwidGkiOiJhMjFkNDIzYS00M2ZkLTQ4MjEtODRmYS00MzkwZjZhMmZkM2UiLCJjIjoidGlja2V0YW5pYSIsImUiOiJteWV2ZW50In0.0rDlI69F1Dx4Twps5qD4cQrbXbCRiezBd6fH1PVm6CloFzIj6sbdeItH-K5iOaF5.ZIg2jffmxRhCb1lv--w2DrOPofnsOvTXKt5dEGfrk7k";

        const enqueueToken = Token.Parse(tokenString, "5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");

        expect(enqueueToken.Payload.CustomData).to.not.be.null;
        expect(Object.keys(enqueueToken.Payload.CustomData).length).to.be.equal(0);
    });

    it('should parse a token with minimal header', () => {
        const hash = "ChCRF4bTbt4zlOcvXLjQYouhgqgiNNNZqcci8VWoZIU";
        const token =
            "eyJ0eXAiOiJRVDEiLCJlbmMiOiJBRVMyNTYiLCJpc3MiOjE1MzQ3MjMyMDAwMDAsInRpIjoiYTIxZDQyM2EtNDNmZC00ODIxLTg0ZmEtNDM5MGY2YTJmZDNlIiwiYyI6InRpY2tldGFuaWEifQ.";
        const tokenString = token + "." + hash;

        const enqueueToken = Token.Parse(tokenString, "5ebbf794-1665-4d48-80d6-21ac34be7faedf9e10b3-551a-4682-bb77-fee59d6355d6");

        expect(enqueueToken.TokenIdentifier).to.be.equal("a21d423a-43fd-4821-84fa-4390f6a2fd3e");
        expect(enqueueToken.CustomerId).to.be.equal("ticketania");
        expect(enqueueToken.EventId).to.be.undefined;
        expect(enqueueToken.Expires.getTime()).to.be.equal(Utils.maxDate().getTime());
        expect(enqueueToken.Issued.getTime()).to.be.equal(new Date(Date.UTC(2018, 8 - 1, 20, 0, 0, 0)).getTime());
        expect(enqueueToken.HashCode).to.be.equal(hash,);
        expect(enqueueToken.TokenWithoutHash).to.be.equal(token);
        expect(enqueueToken.Token).to.be.equal(tokenString);
        expect(enqueueToken.Encryption).to.be.equal(EncryptionType.AES256);
        expect(enqueueToken.TokenVersion).to.be.equal(TokenVersion.QT1);
        expect(enqueueToken.Payload).to.be.undefined;
    });
});
