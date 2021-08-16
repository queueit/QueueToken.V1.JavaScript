import {AESEncryption, Utils} from "../QueueITHelpers";
import {Base64} from "../helpers/Base64";

export class PayloadDto {
    public RelativeQuality?: number
    public Key: string
    public CustomData?: object

    Serialize(): Uint8Array {
        const obj = {
          r: this.RelativeQuality,
          k: this.Key
        };
        if(this.CustomData && Object.keys(this.CustomData).length>0){
            obj['cd'] = this.CustomData
        }
        let jsonData = JSON.stringify(obj);

        return Utils.stringToUint8Array(jsonData);
    }

    static DeserializePayload(input: string, secretKey: string, tokenIdentifier: string): PayloadDto {
        const headerEncrypted = Base64.decode(input);
        const decryptedBytes: Uint8Array = AESEncryption.DecryptPayload(secretKey, tokenIdentifier, headerEncrypted);
        const jsonData = JSON.parse(Utils.uint8ArrayToString(decryptedBytes));
        if(jsonData==null) return null;

        const payload = new PayloadDto();
        payload.RelativeQuality = jsonData['r'];
        payload.Key = jsonData['k'];
        if(jsonData['cd']){
            payload.CustomData = jsonData['cd'];
        }
        return payload;
    }
}
