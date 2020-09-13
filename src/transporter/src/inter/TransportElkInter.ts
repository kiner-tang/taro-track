/**
 * @date 2020-09-12
 * @author kinertang
 * @description
 */

import { Transporter } from "@/transporter/src/Transporter";
import { BaseDataType } from "@kiner/taro-track-common";

export interface Query {
  [key: string]: number | string | boolean;
}

export interface TransporterElkOptions {
  urlMaxLength?: number;
  getMethodServer?: string;
  headeMethodServer?: string;
  postMethodServer?: string;
  query?: Query;
}

export interface TransporterCallback {
  (message?: string): void;
}

export interface ITransporterElk<T extends BaseDataType> extends Transporter<T> {}

export interface ElkData {
  [key: string]: string;
}
