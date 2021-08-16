import {Utils} from "../QueueITHelpers";

export class Base64 {
    private static PADCHAR: string = '=';
    private static ALPHA: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';


    private static getByte64(s: string, i: number): number {
        return Base64.ALPHA.indexOf(s.charAt(i));
    }

    public static decode(s: string): Uint8Array {
        s = s.split('-').join('+')
            .split('_').join('/');

        if (s.length === 0) {
            return new Uint8Array(0);
        }
        let padding = s.length % 4;
        if(padding==3) padding = 1;
        s = Utils.padRight(s, "=", s.length + padding);

        let pads = 0,
            i, b10, imax = s.length,
            x = [];

        if (s.charAt(imax - 1) === Base64.PADCHAR) {
            pads = 1;
            if (s.charAt(imax - 2) === Base64.PADCHAR) {
                pads = 2;
            }
            imax -= 4;
        }

        for (i = 0; i < imax; i += 4) {
            b10 = (Base64.getByte64(s, i) << 18) | (Base64.getByte64(s, i + 1) << 12) | (Base64.getByte64(s, i + 2) << 6) | Base64.getByte64(s, i + 3);
            x.push(b10 >> 16, (b10 >> 8) & 255, b10 & 255);
        }

        switch (pads) {
            case 1:
                b10 = (Base64.getByte64(s, i) << 18) | (Base64.getByte64(s, i + 1) << 12) | (Base64.getByte64(s, i + 2) << 6);
                x.push(b10 >> 16, (b10 >> 8) & 255);
                break;
            case 2:
                b10 = (Base64.getByte64(s, i) << 18) | (Base64.getByte64(s, i + 1) << 12);
                x.push(b10 >> 16);
                break;
        }

        return new Uint8Array(x);
    }

    public static encode(s: Uint8Array): string {
        let i, b10, x = [],
            imax = s.length - s.length % 3;

        if (s.length === 0) {
            return s.toString();
        }

        for (i = 0; i < imax; i += 3) {
            b10 = (s[i] << 16) | (s[i + 1] << 8) | s[i + 2];
            x.push(this.ALPHA.charAt(b10 >> 18));
            x.push(this.ALPHA.charAt((b10 >> 12) & 63));
            x.push(this.ALPHA.charAt((b10 >> 6) & 63));
            x.push(this.ALPHA.charAt(b10 & 63));
        }

        switch (s.length - imax) {
            case 1:
                b10 = s[i] << 16;
                x.push(Base64.ALPHA.charAt(b10 >> 18) + Base64.ALPHA.charAt((b10 >> 12) & 63) + Base64.PADCHAR + Base64.PADCHAR);
                break;
            case 2:
                b10 = (s[i] << 16) | (s[i + 1] << 8);
                x.push(Base64.ALPHA.charAt(b10 >> 18) + Base64.ALPHA.charAt((b10 >> 12) & 63) + Base64.ALPHA.charAt((b10 >> 6) & 63) + Base64.PADCHAR);
                break;
        }

        const encoded = x.join('')
            .split('+').join('-')
            .split('/').join('_');
        return trimEnd(encoded, '=');
    }
}

function trimEnd(value: string, charsToTrim: string): string {
    if (value.length == 0) return "";
    let i = value.length;
    for (; i >= 0;) {
        let contained = charsToTrim.indexOf(value.charAt(i)) != -1;
        if (!contained) {
            break;
        }
        i--;
    }

    return value.substring(0, i + 1);
}
