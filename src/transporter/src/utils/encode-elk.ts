/**
 * @date 2020-09-12
 * @author kinertang
 * @description elk服务器数据编码方式：
 * 1. data->gzip->base64
 * 2. data->gzip
 */

import {zip} from 'gzip-js';
import * as base64 from "@kiner/taro-track-corejs";
type Data = string;

export function isSupportTyped(): boolean {
  return (typeof Uint8Array !== "undefined")
    && (typeof Uint16Array !== "undefined")
    && (typeof Int32Array !== "undefined");
}

export const SupportTyped = isSupportTyped();

export function encodeToUint8Array(data: Data): number[] {
  return zip(data,{});
}

const ArrayProto = Array.prototype;

export function encodeToArray(data: Data): number[] {
  if (SupportTyped) {
    return Array.from(encodeToUint8Array(data));
  }

  const binary: string = zip(data).join('');
  return ArrayProto.slice.call(binary).map(function (v: string): number {
    return v.charCodeAt(0);
  });
}

export function encodeToBase64(data: Data): string {
  if (SupportTyped) {
    return base64.encode(Array.from(encodeToUint8Array(data)));
  }

  return base64.encode(encodeToArray(data));
}
