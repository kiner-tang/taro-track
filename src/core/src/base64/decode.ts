/**
 * @date 2020-09-12
 * @author kinertang
 * @description
 */

import Marker from './mark';

export default function(input: string): number[] {
  const output: number[] = [];
  let chr1: number, chr2: number, chr3: number;
  let enc1: number, enc2: number, enc3: number, enc4: number;
  let i: number = 0;

  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

  while (i < input.length) {
    enc1 = Marker.indexOf(input.charAt(i++));
    enc2 = Marker.indexOf(input.charAt(i++));
    enc3 = Marker.indexOf(input.charAt(i++));
    enc4 = Marker.indexOf(input.charAt(i++));
    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output.push(chr1);
    if (enc3 !== 64) {
      output.push(chr2);
    }
    if (enc4 !== 64) {
      output.push(chr3);
    }
  }

  return output;
}
