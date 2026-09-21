/*
 * Ported from the legacy app's PageUtils.ts ("TheUte"). Used to encode/decode
 * values exchanged with the REST CalcEngine command protocol: `pack` before
 * sending, `unravel` after receiving.
 */

const KEY_STR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const SAFE_CHARS =
  '0123456789' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz' +
  "-_.!~*'()";
const HEX = '0123456789ABCDEF';
const HEX_CHARS = '0123456789ABCDEFabcdef';

function encode64(input) {
  let output = '';
  let chr1, chr2, chr3;
  let enc1, enc2, enc3, enc4;
  let i = 0;

  do {
    chr1 = input.charCodeAt(i++);
    chr2 = input.charCodeAt(i++);
    chr3 = input.charCodeAt(i++);

    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output +=
      KEY_STR.charAt(enc1) + KEY_STR.charAt(enc2) + KEY_STR.charAt(enc3) + KEY_STR.charAt(enc4);
  } while (i < input.length);

  return output;
}

function decode64(input) {
  let output = '';
  let chr1, chr2, chr3;
  let enc1, enc2, enc3, enc4;
  let i = 0;

  input = input.replace(/[^A-Za-z0-9+/=]/g, '');

  do {
    enc1 = KEY_STR.indexOf(input.charAt(i++));
    enc2 = KEY_STR.indexOf(input.charAt(i++));
    enc3 = KEY_STR.indexOf(input.charAt(i++));
    enc4 = KEY_STR.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  } while (i < input.length);

  return output;
}

function urlEncode(plaintext) {
  let encoded = '';
  for (let i = 0; i < plaintext.length; i++) {
    const ch = plaintext.charAt(i);
    if (ch === ' ') {
      encoded += '+';
    } else if (SAFE_CHARS.indexOf(ch) !== -1) {
      encoded += ch;
    } else {
      const charCode = ch.charCodeAt(0);
      if (charCode > 255) {
        console.warn(
          `Unicode character '${ch}' cannot be encoded using standard URL encoding; substituting '+'.`
        );
        encoded += '+';
      } else {
        encoded += '%' + HEX.charAt((charCode >> 4) & 0xf) + HEX.charAt(charCode & 0xf);
      }
    }
  }
  return encoded;
}

function urlDecode(encString) {
  let plaintext = '';
  try {
    if (encString) {
      let i = 0;
      while (i < encString.length) {
        const ch = encString.charAt(i);
        if (ch === '+') {
          plaintext += ' ';
          i++;
        } else if (ch === '%') {
          if (
            i < encString.length - 2 &&
            HEX_CHARS.indexOf(encString.charAt(i + 1)) !== -1 &&
            HEX_CHARS.indexOf(encString.charAt(i + 2)) !== -1
          ) {
            plaintext += decodeURIComponent(encString.substr(i, 3));
            i += 3;
          } else {
            console.warn('Bad escape combination near ...' + encString.substr(i));
            plaintext += '%[ERROR]';
            i++;
          }
        } else {
          plaintext += ch;
          i++;
        }
      }
    } else {
      console.warn('Passed in undefined enc string');
    }
  } catch (urldex) {
    console.error(urldex);
  }
  return plaintext;
}

export const TheUte = {
  pack(what) {
    return urlEncode(encode64(what));
  },
  unravel(what) {
    return decode64(urlDecode(what));
  },
  isAnum(n) {
    return n - 0 == n && (n + '').replace(/^\s+|\s+$/g, '').length > 0;
  },
};
