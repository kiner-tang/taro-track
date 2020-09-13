/**
 * 库文件源码构建器
 * @author kinertang
 * @description 本文件用于在微信小程序中创建库文件，并提供基础模版，使用者只需调用createWxModuleSourceFragment传入具体逻辑代码即可
 * 如：
 * createWxModuleSourceFragment(
 *    `
 *        exports.logger = function(msg,...rest){
 *             const label = '['+exports.config.TaroTrackLoggerNamespace+':Plugin] '+msg;
 *             console.groupCollapsed(label);
 *             rest.forEach(item=>{
 *               console.log(item);
 *             });
 *             console.groupEnd();
 *           }
 *    `
 * )
 *
 *
 */
import { TaroTrackLibName } from '@kiner/taro-track-common';

const injectSymbol = `/////////inject/////////`;
const fragment = `
  (wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([
  ["${TaroTrackLibName}"],
  {
    "./${TaroTrackLibName}.js": function(
      module,
      exports,
      __webpack_require__
    ) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });

      ${injectSymbol}


    }
  }
]);

`;

export function createWxModuleSourceFragment(core: string): string {

  return fragment.replace(injectSymbol, core);

}
