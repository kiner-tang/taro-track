/**
 * @author kinertang
 * @date 2020-09-12
 * @description 微信小程序上报通道
 */

import { Query } from "@/transporter/src/inter/TransportElkInter";
import { ELKLogServerHost } from "@/transporter/src/config";
import { encodeToArray } from "@/transporter/src/utils/encode-elk";
import { BaseDataType, Pipeline } from "@kiner/taro-track-common";
import { getWxRequest, serialized, WxRequest } from "@kiner/taro-track-corejs";
import * as base64 from "@kiner/taro-track-corejs";

export interface TransporterCallback {
  (message?: string): void
}

export interface TransporterOptions {
  urlMaxLength?: number;
  getMethodServer?: string;
  headMethodServer?: string;
  postMethodServer?: string;
  query?: Query;
  baseUrl?: string;
}

export interface ITransporter<T extends BaseDataType> extends Pipeline<T> {
  send(data: T, callback?: TransporterCallback): void;
  post(dataArray: T[], callback?: TransporterCallback): void;
}


export class WechatTransporter<T extends BaseDataType> implements ITransporter<T> {
  private query: string;
  private serverHost: string = ELKLogServerHost;
  private supportUint8Array: boolean = Uint8Array && (typeof Uint8Array.from === "function");
  private options: TransporterOptions;
  private defaultOptions: TransporterOptions;
  private wxRequest: WxRequest = getWxRequest();

  public static create<U extends BaseDataType>(
    options?: TransporterOptions
  ): ITransporter<U> {
    return new WechatTransporter(options);
  }

  public constructor(options?: TransporterOptions) {

    this.defaultOptions = {
      urlMaxLength: 2048,
      getMethodServer:  `${options.baseUrl || ELKLogServerHost}/lu`,
      headMethodServer:  `${options.baseUrl || ELKLogServerHost}/lu`,
      postMethodServer: `${options.baseUrl || ELKLogServerHost}/lp`,
      query: {
        app_name: "unknow_app_name",
        app_version: "unknow_app_version",
        ev_type: "unknow_type"
      }
    };

    this.options = {
      ...this.defaultOptions,
      ...options
    };

    this.query = serialized(this.options.query);
  }

  private getRequestURI(uri: string, query: string): string {
    return uri
      + "?"
      + this.query
      + (query ? (this.query ? ("&" + query) : query) : "");
  }

  private async sendDataByPostMethod(code: number[], callback?: TransporterCallback): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wxRequest({
        method: "POST",
        header: {
          "Content-Type": "application/octet-stream",
          "Content-Encoding": this.supportUint8Array ? "gzip" : "gzip+base64",
        },
        data: this.supportUint8Array ? Uint8Array.from(code) : base64.encode(code),
        url: this.getRequestURI(this.options.postMethodServer, ""),
        success: () => {
          callback && callback();
          resolve();
        },
        fail: (error) => {
          callback && callback(error.errMsg);
          reject(error.errMsg);
        }
      });
    });
  }

  private async sendDataByHeadMethod(code: number[], callback?: TransporterCallback): Promise<void> {
    const encodeBase64: string = base64.encode(code);
    const url: string = this.getRequestURI(
      this.options.headMethodServer,
      "e=gb&q=" + encodeBase64
    );

    return new Promise((resolve, reject) => {
      this.wxRequest({
        url,
        method: "HEAD",
        success: () => {
          callback && callback();
          resolve();
        },
        fail: (error) => {
          callback && callback(error.errMsg);
          reject(error.errMsg);
        }
      });
    });
  }

  public send(data: T, callback?: TransporterCallback): void {
    const gzip: number[] = encodeToArray(JSON.stringify([data]));

    // content will raize 0.25 utf8 to base64.
    if (gzip.length * 1.25 + this.options.headMethodServer.length >
      this.options.urlMaxLength) {
      this.sendDataByPostMethod(gzip, callback);
      return;
    }

    this.sendDataByHeadMethod(gzip, callback);
  }

  public post(data: BaseDataType[], callback?: TransporterCallback): void {
    const gzip: number[] = encodeToArray(JSON.stringify(data));

    this.sendDataByPostMethod(gzip, callback);
  }

  public pipe(next: Pipeline<BaseDataType>) {
    return next;
  }

  async push(data: T[]): Promise<void> {
    const gzip: number[] = encodeToArray(JSON.stringify(data));
    return this.sendDataByPostMethod(gzip);
  }
}
