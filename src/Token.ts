import {TokenVersion} from "./model/TokenVersion";
import {EnqueueTokenPayload, IEnqueueTokenPayload} from "./Payload";
import {EncryptionType} from "./model/EncryptionType";
import {ShaHashing, Utils} from "./QueueITHelpers";
import {HeaderDto} from "./model/HeaderDto";
import {Base64} from "./helpers/Base64";

const InvalidTokenExceptionMessage = "Invalid token";

export class Token {
    public static Enqueue(customerId: string, tokenIdentifierPrefix?: string): EnqueueTokenGenerator {
        return new EnqueueTokenGenerator(customerId, tokenIdentifierPrefix);
    }

    public static Parse(token: string, secretKey: string): IEnqueueToken {
        return EnqueueToken.Parse(token, secretKey);
    }
}

export class EnqueueTokenGenerator {
    private _token: EnqueueToken;

    constructor(customerId: string, tokenIdentifier?: string) {
        this._token = new EnqueueToken(customerId, tokenIdentifier);
    }

    public WithEventId(eventId: string): EnqueueTokenGenerator {
        this._token = EnqueueToken.AddEventId(this._token, eventId);
        return this;
    }

    public WithValidity(validityMillis: number): EnqueueTokenGenerator {
        const newExpiryTime = this._token.Issued.getTime() + validityMillis;
        this._token = EnqueueToken.AddExpires(this._token, newExpiryTime);
        return this;
    }

    public WithValidityDate(validity: Date): EnqueueTokenGenerator {
        this._token = EnqueueToken.AddExpiresWithDate(this._token, validity);
        return this
    }

    public WithPayload(payload: IEnqueueTokenPayload): EnqueueTokenGenerator {
        this._token = EnqueueToken.AddPayload(this._token, payload);
        return this;
    }

    public WithIpAddress(ip: string, xForwardedFor: string): EnqueueTokenGenerator {
        this._token = EnqueueToken.AddIPAddress(this._token, ip, xForwardedFor);
        return this;
    }

    public Generate(secretKey: string): IEnqueueToken {
        this._token.Generate(secretKey);
        return this._token;
    }
}

export class EnqueueToken {
    private readonly _tokenIdentifierPrefix: string;
    public CustomerId: string
    public EventId: string
    public IpAddress: string
    public XForwardedFor: string
    public Issued: Date
    public readonly TokenVersion: TokenVersion = TokenVersion.QT1;
    public readonly Encryption: EncryptionType = EncryptionType.AES256;
    public Expires: Date
    private _tokenIdentifier: string
    private _payload: IEnqueueTokenPayload
    private _tokenWithoutHash: string
    private _hashCode: string

    public get Payload(): IEnqueueTokenPayload {
        return this._payload;
    }

    private set Payload(value: IEnqueueTokenPayload) {
        this._payload = value;
    }

    public get Token(): string {
        return this.TokenWithoutHash + "." + this.HashCode
    };

    get HashCode(): string {
        return this._hashCode;
    }

    private set HashCode(value: string) {
        this._hashCode = value;
    }

    get TokenWithoutHash(): string {
        return this._tokenWithoutHash;
    }

    private set TokenWithoutHash(value: string) {
        this._tokenWithoutHash = value;
    }

    get TokenIdentifier(): string {
        return this._tokenIdentifier
    }

    private set TokenIdentifier(value: string) {
        this._tokenIdentifier = value;
    }

    constructor(customerId: string, tokenIdentifierPrefix: string) {
        this._tokenIdentifierPrefix = tokenIdentifierPrefix;
        this.CustomerId = customerId;
        this.Issued = new Date(Utils.utcNow());
        this.Expires = Utils.maxDate();
        this._tokenIdentifier = EnqueueToken.GetTokenIdentifier(tokenIdentifierPrefix);
    }

    public static Create(tokenIdentifier: string,
                         customerId: string,
                         eventId: string,
                         issued: Date,
                         expires: Date,
                         ipAddress: string,
                         xForwardedFor: string,
                         payload: IEnqueueTokenPayload) {
        const token = new EnqueueToken(customerId, "");
        token.TokenIdentifier = tokenIdentifier;
        token.CustomerId = customerId;
        token.EventId = eventId;
        token.Issued = issued;
        token.Expires = expires ?? Utils.maxDate();
        token.Payload = payload;
        token.IpAddress = ipAddress;
        token.XForwardedFor = xForwardedFor;
        return token;
    }


    private static GetTokenIdentifier(tokenIdentifierPrefix: string): string {
        return tokenIdentifierPrefix && tokenIdentifierPrefix.length > 0
            ? `${tokenIdentifierPrefix}~${Utils.generateUUID()}`
            : Utils.generateUUID();
    }

    public Generate(secretKey: string, resetTokenIdentifier: boolean = true) {
        if (resetTokenIdentifier) {
            this.TokenIdentifier = EnqueueToken.GetTokenIdentifier(this._tokenIdentifierPrefix)
        }

        try {
            const utcTimeIssued = this.Issued.getTime();
            const utcTimeExpires = (this.Expires && this.Expires.getTime() == Utils.maxDate().getTime()) ? null :
                this.Expires.getTime();
            const dto = new HeaderDto();
            dto.CustomerId = this.CustomerId;
            dto.EventId = this.EventId;
            dto.TokenIdentifier = this.TokenIdentifier;
            dto.Issued = utcTimeIssued;
            dto.Expires = utcTimeExpires;
            dto.Encryption = EncryptionType[EncryptionType.AES256];
            dto.TokenVersion = TokenVersion[TokenVersion.QT1];
            dto.IpAddress = this.IpAddress;
            dto.XForwardedFor = this.XForwardedFor;

            let serialized = dto.Serialize() + ".";
            if (this.Payload) {
                serialized += this.Payload.EncryptAndEncode(secretKey, this.TokenIdentifier);
            }
            this.TokenWithoutHash = serialized;
            const sha256Hash = ShaHashing.GenerateHash(secretKey, this.TokenWithoutHash);
            this.HashCode = Base64.encode(sha256Hash);
        } catch (ex) {
            throw new TokenSerializationException(ex);
        }
    }


    public static Parse(tokenString: string, secretKey: string): IEnqueueToken {
        if (!secretKey || secretKey.length == 0) {
            throw new ArgumentException("Invalid secret key");
        }
        if (!tokenString || tokenString.length == 0) {
            throw new ArgumentException(InvalidTokenExceptionMessage);
        }

        const tokenParts = tokenString.split(".");
        const headerPart = tokenParts[0];
        const payloadPart = tokenParts[1];
        const hashPart = tokenParts[2];

        if (headerPart.length == 0) {
            throw new ArgumentException(InvalidTokenExceptionMessage);
        }
        if (hashPart.length == 0) {
            throw new ArgumentException(InvalidTokenExceptionMessage);
        }

        const token = headerPart + "." + payloadPart;
        const hash = ShaHashing.GenerateHash(secretKey, token);
        const expectedHash = Base64.encode(hash);
        if (expectedHash != hashPart) {
            throw new InvalidHashException();
        }

        try {
            const headerModel = HeaderDto.DeserializeHeader(headerPart);
            let payload: EnqueueTokenPayload;
            if (payloadPart.length > 0) {
                payload = EnqueueTokenPayload.Deserialize(payloadPart, secretKey, headerModel.TokenIdentifier);
            }

            const issuedTime: Date = new Date(headerModel.Issued);
            const expiresDate: Date = headerModel.Expires
                ? (new Date(headerModel.Expires))
                : null;
            const enqueueToken = EnqueueToken.Create(
                headerModel.TokenIdentifier,
                headerModel.CustomerId,
                headerModel.EventId,
                issuedTime,
                expiresDate,
                headerModel.IpAddress,
                headerModel.XForwardedFor,
                payload);
            enqueueToken.TokenWithoutHash = token;
            enqueueToken.HashCode = expectedHash;
            return enqueueToken;
        } catch (ex) {
            throw new TokenDeserializationException("Unable to deserialize token", ex);
        }
    }

    static AddIPAddress(token: EnqueueToken, ipAddress: string, xForwardedFor: string): EnqueueToken {
        return EnqueueToken.Create(token.TokenIdentifier, token.CustomerId, token.EventId, token.Issued, token.Expires, ipAddress, xForwardedFor, token.Payload);
    }

    static AddEventId(token: EnqueueToken, eventId: string): EnqueueToken {
        return EnqueueToken.Create(token.TokenIdentifier, token.CustomerId, eventId, token.Issued, token.Expires, token.IpAddress, token.XForwardedFor, token.Payload);
    }

    static AddExpires(token: EnqueueToken, expires: number): EnqueueToken {
        return EnqueueToken.Create(token.TokenIdentifier, token.CustomerId, token.EventId, token.Issued, new Date(expires), token.IpAddress, token.XForwardedFor, token.Payload);
    }

    static AddExpiresWithDate(token: EnqueueToken, expires: Date): EnqueueToken {
        return EnqueueToken.Create(token.TokenIdentifier, token.CustomerId, token.EventId, token.Issued, expires, token.IpAddress, token.XForwardedFor, token.Payload);
    }

    static AddPayload(token: EnqueueToken, payload: IEnqueueTokenPayload): EnqueueToken {
        return EnqueueToken.Create(token.TokenIdentifier, token.CustomerId, token.EventId, token.Issued, token.Expires, token.IpAddress, token.XForwardedFor, payload);
    }
}

export class TokenDeserializationException extends Error {
    public readonly InternalException: Error

    public constructor(message: string, ex: Error) {
        super(message);
        this.InternalException = ex;
    }
}

export class InvalidHashException extends TokenDeserializationException {
    public constructor() {
        super("The token hash is invalid", null);
    }
}

export class TokenSerializationException extends Error {
    public readonly InternalException: Error

    public constructor(ex: Error) {
        super("Exception serializing token");
        this.InternalException = ex;
    }
}

export class ArgumentException extends Error {
    constructor(message: string) {
        super(message);
    }
}

export interface IEnqueueToken {
    readonly TokenVersion: TokenVersion
    readonly Encryption: EncryptionType
    readonly Issued: Date
    readonly Expires: Date
    readonly TokenIdentifier: string
    readonly CustomerId: string
    readonly EventId: string
    readonly IpAddress: string
    readonly XForwardedFor: string
    readonly Payload: IEnqueueTokenPayload
    readonly TokenWithoutHash: string
    readonly Token: string
    readonly HashCode: string
}
