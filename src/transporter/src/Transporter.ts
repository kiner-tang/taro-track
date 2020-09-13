import { BaseDataType, Pipeline } from "@kiner/taro-track-common";


export interface TransporterCallback {
  (message?: string): void
};

export interface Transporter<T extends BaseDataType> extends Pipeline<T>{
  send(data: T, callback?: TransporterCallback): void;
  post(dataArray: T[], callback?: TransporterCallback): void;
};
