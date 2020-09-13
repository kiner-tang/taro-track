/**
 * @date 2020-09-12
 * @author kinertang
 * @description
 */

import Marker from "./mark";

export default function(array: number[]): string {

  if (array.length < 1) {
    return "";
  }

  let o1: number;
  let o2: number;
  let o3: number;

  let h1: number;
  let h2: number;
  let h3: number;
  let h4: number;
  let bits: number;
  let i: number = 0;
  let ac: number = 0;
  let enc: string = "";
  let tmp_arr: string[] = [];

  do {
    // pack three octets into four hexets
    o1 = array[i++];
    o2 = array[i++];
    o3 = array[i++];

    bits = o1 << 16 | o2 << 8 | o3;

    h1 = bits >> 18 & 0x3f;
    h2 = bits >> 12 & 0x3f;
    h3 = bits >> 6 & 0x3f;
    h4 = bits & 0x3f;

    // use hexets to index into Marker, and append result to encoded string
    tmp_arr[ac++] = Marker.charAt(h1) + Marker.charAt(h2) + Marker.charAt(h3) + Marker.charAt(h4);
  } while (i < array.length);

  enc = tmp_arr.join("");

  switch (array.length % 3) {
    case 1:
      enc = enc.slice(0, -2) + "==";
      break;
    case 2:
      enc = enc.slice(0, -1) + "=";
      break;
  }

  return enc;
}
