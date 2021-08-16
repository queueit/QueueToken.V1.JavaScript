import {Base64} from "../helpers/Base64";
import {Utils} from "../QueueITHelpers";

export class HeaderDto {
    public TokenVersion: string
    public Encryption: string
    public Issued: number
    public Expires?: number
    public TokenIdentifier: string
    public CustomerId: string
    public EventId: string
    public IpAddress: string
    public XForwardedFor: string

    static DeserializeHeader(input: string): HeaderDto {
        const decoded = Base64.decode(input);
        const jsonData = JSON.parse(Utils.uint8ArrayToString(decoded));
        const header = new HeaderDto();
        header.TokenVersion = jsonData['typ'];
        header.Encryption = jsonData['enc'];
        header.Issued = jsonData['iss'];
        header.Expires = jsonData['exp'];
        header.TokenIdentifier = jsonData['ti'];
        header.CustomerId = jsonData['c'];
        header.EventId = jsonData['e'];
        header.IpAddress = jsonData['ip'];
        header.XForwardedFor = jsonData['xff'];

        return header;
    }

    Serialize(): string {
        const obj = {
            typ: this.TokenVersion,
            enc: this.Encryption,
            iss: this.Issued
        };
        if (this.Expires) obj['exp'] = this.Expires;
        obj["ti"] = this.TokenIdentifier;
        obj["c"] = this.CustomerId;

        if (this.EventId) obj['e'] = this.EventId;
        if (this.IpAddress) obj['ip'] = this.IpAddress;
        if (this.XForwardedFor) obj['xff'] = this.XForwardedFor;

        const jsonData = JSON.stringify(obj);
        return Base64.encode(Utils.stringToUint8Array(jsonData));
    }
}
