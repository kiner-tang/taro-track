/**
 * @date 2020-09-12
 * @author kinertang
 * @description 微信小程序获取上一个页面
 */
import RequestOption = WechatMiniprogram.RequestOption;
import RequestTask = WechatMiniprogram.RequestTask;
import UploadTask = WechatMiniprogram.UploadTask;
import UploadFileOption = WechatMiniprogram.UploadFileOption;
import DownloadFileOption = WechatMiniprogram.DownloadFileOption;
import DownloadTask = WechatMiniprogram.DownloadTask;
import GetNetworkTypeSuccessCallbackResult = WechatMiniprogram.GetNetworkTypeSuccessCallbackResult;
import GeneralCallbackResult = WechatMiniprogram.GeneralCallbackResult;
import GetNetworkTypeOption = WechatMiniprogram.GetNetworkTypeOption;
import OnNetworkStatusChangeCallbackResult = WechatMiniprogram.OnNetworkStatusChangeCallbackResult;
import Instance = WechatMiniprogram.Page.Instance;
import IAnyObject = WechatMiniprogram.IAnyObject;
import { Logger } from '@/src/core';
const logger = new Logger("code/wx-tools");


export function getWxReferrer(): string {
  const pages = getCurrentPages().map(item => item.route);
  logger.info(`taro-track:getWxReferrer`, pages);
  return pages.length === 1 ? '' : pages[pages.length - 2]
}

/**
 * 获取当前页面的url
 */
export function getWxCurrentHref(): string {
  const pages = getCurrentPages().map(item => item.route);
  return pages[pages.length - 1]
}
/**
 * 获取当前页面堆栈
 */
export function getWxCurrentPagesStack(): Array<Instance<IAnyObject, IAnyObject>> {
  return getCurrentPages()
}

/**
 * 获取微信的网络状况
 */
export function getWxNetwork(): Promise<string> {

  return new Promise<string>(resolve => {
    wx.getNetworkType({
      success(result) {
        resolve(result.networkType);
      }
    })
  });

}

/**
 * 获取微信系统相关信息
 */
export function getWxSystemInfo() {
  let os = wx.getSystemInfoSync();
  return {
    osInfo: function () {
      return `${os.system}`;
    },
    wechatInfo: function () {
      return `${os.version} ${os.SDKVersion}`;
    },
    langInfo: function () {
      return `${os.language}`;
    },
    originalOs: os
  }
}

/**
 * 设置或获取Storage
 * @param key
 * @param val
 */
export function storage(key: string, val?: any): any {
  if (val === undefined) {
    return wx.getStorageSync(key);
  } else {
    wx.setStorageSync(key, val);
  }
}


export const sessionStorageTimeKey = 'SESSION_STORAGE_DATE_';
export const sessionStorageKey = 'SESSION_STORAGE_';

export function sessionStorage(key: string, val?: any, expired?: Date | number) {
  const expiredKey = `${sessionStorageTimeKey}${key}`;
  const valKey = `${sessionStorageKey}${key}`;

  // app启动时清空sessionStorage
  // const app = new OverrideWechatApp();
  // app.initialize(hooks=>{
  //   if(hooks===proxyWechatAppLiftHooks.onLaunch){
  //     const res = wx.getStorageInfoSync();
  //     res.keys.forEach(key=>{
  //       if(key.startsWith(sessionStorageKey)||key.startsWith(sessionStorageTimeKey)){
  //         storage.remove(key);
  //       }
  //     });
  //   }
  // });


  if (val === undefined) {
    const expiredTime = storage(expiredKey);
    if (expiredTime) {
      const date = new Date();
      date.setTime(parseInt(expiredTime));
      if (date.getTime() - Date.now() <= 0) {// 如果已经过期，则删除并返回null
        storage.remove(valKey);
        storage.remove(expiredKey);
        return null;
      }
      return storage(valKey);
    }
    return storage(valKey);
  } else {
    storage(valKey, val);
    storage(expiredKey, expired);
  }
}

storage.remove = function (key: string): void {
  wx.removeStorageSync(key);
};


let fsm: WechatMiniprogram.FileSystemManager;

/**
 * 获取文件系统管理器
 */
export function getFileSystemManager(): WechatMiniprogram.FileSystemManager {
  return fsm ? fsm : (fsm = wx.getFileSystemManager())
}

/**
 * 监听微信小程序的显示和隐藏
 */
export function toggleAppShow(cb: (isShow: boolean) => void): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    wx.onAppShow(() => {
      cb(true);
      resolve(true);
    });
    wx.onAppShow(() => {
      cb(true);
      resolve(false);
    })
  });
}

export type WxRequest = (option: RequestOption) => RequestTask;
export type WxUpload = (option: UploadFileOption) => UploadTask;
export type WxDownload = (option: DownloadFileOption) => DownloadTask;

let wxRequest: WxRequest, wxUpload: WxUpload, wxDownload: WxDownload;

/**
 * 获取微信的request
 */
export function getWxRequest(): WxRequest {
  return wxRequest ? wxRequest : (wxRequest = wx.request);
}

export function overrideWxRequest(newRequest: any){
  // 通过这种方式无法改写
  // wx.request = newRequest;
  Object.defineProperty(wx, "request", { value: newRequest});
}

/**
 * 获取微信的uploadFile
 */
export function getWxUpload(): WxUpload {
  return wxUpload ? wxUpload : (wxUpload = wx.uploadFile);
}
export function overrideWxUpload(newUpload: any){
  Object.defineProperty(wx, "uploadFile", { value: newUpload});
  // 通过这种方式无法改写
  // wx.uploadFile = newUpload;
}

/**
 * 获取微信的downloadFile
 */
export function getWxDownload(): WxDownload {
  return wxDownload ? wxDownload : (wxDownload = wx.downloadFile);
}

export function overrideWxDownload(newDownload: any){
  Object.defineProperty(wx, "downloadFile", { value: newDownload});
}
/**
 * 获取网络类型
 */
export function getWxNetworkType(options?: GetNetworkTypeOption): Promise<GetNetworkTypeSuccessCallbackResult & GeneralCallbackResult> {
  return new Promise<GetNetworkTypeSuccessCallbackResult>((resolve, reject) => {
    wx.getNetworkType({
      success(opts) {
        resolve(opts);
        options && options.success(opts);
      },
      fail(opts) {
        reject(opts);
        options && options.fail(opts);
      }
    })
  });
}

export function onWxNetworkStatusChange(cb: (result: OnNetworkStatusChangeCallbackResult) => void) {
  wx.onNetworkStatusChange(result => {
    cb(result);
  })
}


interface LineAndCol {
  line: number
  column: number
}


const lineAndColNumReg = /\(.*\:(\d+)\:(\d+)\)$/gi;

export function resolveErrorMessageLineAndColNum(str: string): LineAndCol {
  const res = lineAndColNumReg.exec(str);
  if (res) {
    return {
      line: parseInt(res[1]),
      column: parseInt(res[2])
    }
  } else {
    return {
      line: -1,
      column: -1
    }
  }
}


interface OnWindowErrorBackpass {
  message: string;
  source: string;
  line: number;
  column: number;
}

export function parseErrorMessage(error: string): OnWindowErrorBackpass {

  if (!error||!error.split) {
    return {
      message: error,
      source: error,
      line: -1,
      column: -1
    }
  }

  const errors = error.split('\n');

  const {line, column} = resolveErrorMessageLineAndColNum(errors.filter(item => item.match(/\S*at/))[0]);

  let message = errors[0];
  let source = error;
  return {
    message,
    source,
    line,
    column
  }
}

/**
 * 比较微信版本号
 * @param v1
 * @param v2
 */
export function compareVersion(v1: string, v2: string) {
  const v1Arr = v1.split('.')
  const v2Arr = v2.split('.')
  const len = Math.max(v1Arr.length, v2Arr.length)

  while (v1Arr.length < len) {
    v1Arr.push('0')
  }
  while (v2.length < len) {
    v2Arr.push('0')
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1Arr[i])
    const num2 = parseInt(v2Arr[i])

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }

  return 0
}

/**
 * 判断当前微信版本是否高于给定目标版本
 * @param targetVersion
 */
export function canIUse(targetVersion: string) {
  const version = wx.getSystemInfoSync().SDKVersion

  return compareVersion(version, targetVersion) >= 0
}

/**
 * 获取微信原生Page
 * @returns {WechatMiniprogram.Page.Constructor}
 */
export function getWxPage():WechatMiniprogram.Page.Constructor  {
  return Page;
}

/**
 * 重写微信原生Page
 * @param newPage
 */
export function overrideWxPage(newPage: any):void {
  Page = newPage;
}

/**
 * 获取微信原生App
 * @returns {WechatMiniprogram.App.Constructor}
 */
export function getWxApp():WechatMiniprogram.App.Constructor {
  return App;
}

/**
 * 重写微信原生App
 * @param newApp
 */
export function overrideWxApp(newApp: any): void {
  App = newApp;
}

/**
 * 获取微信原生Component
 * @returns {WechatMiniprogram.Component.Constructor}
 */
export function getWxComponent():WechatMiniprogram.Component.Constructor {
  return Component;
}

/**
 * 重写微信原生Component
 * @param newComponent
 */
export function overrideWxComponent(newComponent: any): void {
  Component = newComponent;
}

/**
 * 获取微信原生Performance
 * # 注：此方法仅在2.11.0以上的基础库才支持，目前微信开发者工具中，2.22.0版本仍在灰度阶段，尚未正式发布，因此目前还无法使用
 * @returns {any}
 */
export function getWxPerformance() {
  try{
    // @ts-ignore
    return wx.getPerformance();
  }catch (e) {
    return null;
  }
}
/**
 * 获取微信原生PerformanceObserver
 * # 注：此方法仅在2.11.0以上的基础库才支持，目前微信开发者工具中，2.22.0版本仍在灰度阶段，尚未正式发布，因此目前还无法使用
 * @returns {any}
 */
export function createWxPerformanceObserver(cb:(entryList: any)=>void): any{
  try{
    return getWxPerformance().createObserver((entryList:any) => {
      cb&&cb(entryList);
    });
  }catch (e) {
    return null;
  }
}
