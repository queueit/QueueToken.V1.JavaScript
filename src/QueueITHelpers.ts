import {Base64} from "./helpers/Base64";
import {ModeOfOperationCBC, Utf8Converter} from "./helpers/Aes";
import {md5} from "./helpers/Md5";
import sha256 from "./helpers/Sha";

export class Utils {

    static maxDate(): Date {
        return new Date(Date.UTC(9999, 12 - 1, 31, 23, 59, 59, 999));
    }

    static utcNow(): number {
        const now = new Date();
        return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
    }

    static padRight(str: string, padding: string, stringSize: number) {
        while (str.length < stringSize) {
            str += padding
        }
        return str;
    }

    // Based on REF 4122 section 4.4 http://www.ietf.org/rfc/rfc4122.txt
    static generateUUID(): string {
        const s = [];
        // eslint-disable-next-line no-secrets/no-secrets
        const hexDigits = "0123456789abcdef";
        for (let i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        return s.join("");
    }

    static generateKey(value: string): Uint8Array {
        const utf8Bytes = Utf8Converter.toBytes(value);
        return sha256(utf8Bytes);
    }

    static generateIV(value: string): Uint8Array {
        const utf8Bytes = Utf8Converter.toBytes(value);
        let bytes: Uint8Array = md5(utf8Bytes);
        if(bytes.slice){
            return bytes.slice(0, 16);
        }else{
            return new Uint8Array(bytes.buffer.slice(0, 16));
        }
    }

    static uint8ArrayToHexString(byteArray: Uint8Array): string {
        let acc = '';
        for (let i = 0; i < byteArray.length; i++) {
            let val = byteArray[i];
            acc += ('0' + val.toString(16)).slice(-2);
        }
        return acc;
    }

    static uint8ArrayToString(array: Uint8Array): string {
        let out = "", i: number, len: number , c: number;
        let char2: number, char3: number;

        len = array.length;
        i = 0;
        while (i < len) {
            c = array[i++];
            switch (c >> 4) {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                    // 0xxxxxxx
                    out += String.fromCharCode(c);
                    break;
                case 12:
                case 13:
                    // 110x xxxx   10xx xxxx
                    char2 = array[i++];
                    out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                    break;
                case 14:
                    // 1110 xxxx  10xx xxxx  10xx xxxx
                    char2 = array[i++];
                    char3 = array[i++];
                    out += String.fromCharCode(((c & 0x0F) << 12) |
                        ((char2 & 0x3F) << 6) |
                        ((char3 & 0x3F) << 0));
                    break;
            }
        }

        return out;
    }

    static stringToUint8Array(value: string): Uint8Array {
        const encoded = encodeURIComponent(value);
        const bytes = [];
        let state = 0;
        for (let i = 0; i < encoded.length; i++) {
            switch (state) {
                case 0: //Convert chars to bytes
                    if (encoded[i] == '%') {
                        state = 1;
                    } else {
                        bytes.push(encoded.charCodeAt(i));
                    }
                    break;
                case 1: //Seen '%'
                    state = 2;
                    break;
                case 2: // Seen %H
                    bytes.push(parseInt(encoded.substring(i - 1, i + 1), 16));
                    state = 0;
                    break;
            }
        }
        return new Uint8Array(bytes);
    }
}

export class ShaHashing {
    public static GenerateHash(secretKey: string, tokenString: string): Uint8Array {
        const content = Utf8Converter.toBytes(tokenString + secretKey);
        return sha256(content);
    }
}

export class AESEncryption {
    static EncryptPayload(secretKey: string, tokenIdentifier: string, valueToEncrypt: string): string {
        const key = Utils.generateKey(secretKey);
        const iv = Utils.generateIV(tokenIdentifier);
        const aesCBC = new ModeOfOperationCBC(key, iv)
        const encrypted: Uint8Array = aesCBC.encrypt(valueToEncrypt);
        return Base64.encode(encrypted);
    }

    static DecryptPayload(secretKey: string, tokenIdentifier: string, valueToDecrypt: Uint8Array): Uint8Array {
        const key = Utils.generateKey(secretKey);
        const iv = Utils.generateIV(tokenIdentifier);
        const aesCBC = new ModeOfOperationCBC(key, iv);
        return aesCBC.decrypt(valueToDecrypt);
    }
}
