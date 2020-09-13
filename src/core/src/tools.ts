/**
 * @date 2020-09-12
 * @author kinertang
 * @description
 */
import { DataTypeObject } from '@kiner/taro-track-common';


const ObjectProto = Object.prototype;

export interface DataTypeValidator<T> {
  (value: any): value is T;
};

export function validatorFactory<T>(type: string): DataTypeValidator<T> {
  return function (value: any): value is T {
    return ObjectProto.toString.call(value) === `[object ${type}]`;
  };
}

const isFunction = validatorFactory<Function>("Function");
const isString = validatorFactory<string>("String");
const isArray = validatorFactory<any[]>("isArray");
const isObject = validatorFactory<DataTypeObject<any>>("Object");

/**
 * 产生[min, max)之间的整数
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function range(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * 序列化对象值
 * @param {any} data
 * @return {string}
 */
function serialized(data: any, encode?: boolean): string {
  if (!isObject(data)) {
    return "";
  }

  return Object.keys(data).map(function(key: string): string {
    const str: string = isString(data[key]) ? data[key] : JSON.stringify(data[key]);
    return `${key}=${encode ? encodeURIComponent(str) : str}`
  }).join("&");
}

function now(): number {
  return Date.now();
}

function isRequired(value: any): boolean {
  if (value === void 0 || value === null || value !== value) {
    return false;
  }

  if (typeof value === "string") {
    return value.length > 0;
  }

  return true;
}

function noop(): void {}

export {
  isFunction,
  isString,
  isArray,
  isObject,

  range,
  serialized,
  now,
  noop,
  isRequired
};
