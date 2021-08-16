import {PayloadDto} from "./model/PayloadDto";
import {Utils} from "./QueueITHelpers";
import {TokenSerializationException} from "./Token";
import {Base64} from "./helpers/Base64";
import {ModeOfOperationCBC} from "./helpers/Aes";

export class Payload {
    public static Enqueue(): EnqueueTokenPayloadGenerator {
        return new EnqueueTokenPayloadGenerator();
    }
}

export class EnqueueTokenPayloadGenerator {
    private _payload: EnqueueTokenPayload

    constructor() {
        this._payload = new EnqueueTokenPayload();
    }

    public WithKey(key: string): EnqueueTokenPayloadGenerator {
        this._payload = EnqueueTokenPayload.create(this._payload, key);
        return this;
    }

    public WithRelativeQuality(relativeQuality: number): EnqueueTokenPayloadGenerator {
        this._payload = EnqueueTokenPayload.create(this._payload, null, relativeQuality);
        return this;
    }

    public WithCustomData(key: string, value: string): EnqueueTokenPayloadGenerator {
        this._payload = EnqueueTokenPayload.create(this._payload, null);
        this._payload.AddCustomData(key, value);
        return this;
    }

    public Generate(): IEnqueueTokenPayload {
        return this._payload;
    }
}

export interface IEnqueueTokenPayload {
    readonly Key: string
    readonly RelativeQuality?: number
    readonly CustomData: Object

    EncryptAndEncode(secretKey: string, tokenIdentifier: string): string

    Serialize(): Uint8Array;
}

export class EnqueueTokenPayload implements IEnqueueTokenPayload {
    private _customData: Object;
    private _key: string;
    private _relativeQuality: number

    public get Key(): string {
        return this._key;
    }

    private set Key(value: string) {
        this._key = value;
    }

    public get CustomData(): Object {
        return this._customData;
    }

    public get RelativeQuality(): number {
        return this._relativeQuality;
    }

    private set RelativeQuality(value: number) {
        this._relativeQuality = value;
    }

    constructor() {
        this._customData = {};
    }

    static create(payload?: EnqueueTokenPayload, key?: string, relativeQuality?: number, customData?: object): EnqueueTokenPayload {
        const newPayload = new EnqueueTokenPayload();
        newPayload.Key = key;
        if (payload) {
            newPayload.RelativeQuality = payload.RelativeQuality;
            newPayload._customData = payload._customData;
            if (!key || key.length == 0) {
                newPayload.Key = payload.Key;
            }
        }
        if (relativeQuality != null) {
            newPayload.RelativeQuality = relativeQuality
        }
        if (customData) {
            newPayload._customData = customData;
        }

        return newPayload;
    }

    public AddCustomData(key: string, value: string): EnqueueTokenPayload {
        if (!this._customData) {
            this._customData = {};
        }
        this._customData[key] = value;
        return this;
    }

    public Serialize(): Uint8Array {
        const dto = new PayloadDto();
        dto.Key = this.Key;
        dto.RelativeQuality = this.RelativeQuality;
        dto.CustomData = this.CustomData;

        return dto.Serialize();
    }

    static Deserialize(input: string, secretKey: string, tokenIdentifier: string): EnqueueTokenPayload {
        const dto = PayloadDto.DeserializePayload(input, secretKey, tokenIdentifier);
        return EnqueueTokenPayload.create(null, dto.Key, dto.RelativeQuality, dto.CustomData)
    }

    EncryptAndEncode(secretKey: string, tokenIdentifier: string): string {
        try {
            const serializedPayload = this.Serialize();
            const key = Utils.generateKey(secretKey);
            const iv = Utils.generateIV(tokenIdentifier);
            const aesCBC = new ModeOfOperationCBC(key, iv)
            const encrypted: Uint8Array = aesCBC.encrypt(serializedPayload);
            return Base64.encode(encrypted);
        } catch (ex) {
            throw new TokenSerializationException(ex);
        }
    }
}
