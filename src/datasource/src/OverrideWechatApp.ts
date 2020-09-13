/**
 * @date 2020-09-12
 * @author kinertang
 * @description 重写微信的Page方式，实现对小程序声明周期的拦截处理操作
 */

import { getWxApp, overrideWxApp,sessionStorageKey, sessionStorageTimeKey, storage } from '@kiner/taro-track-corejs';

export enum proxyWechatAppLiftHooks {
  'onShow' = 'onShow',
  'onHide' = 'onHide',
  'onLaunch' = 'onLaunch',
  'onPageNotFound' = 'onPageNotFound',
  'onError' = 'onError',
}

const proxyMethods = [
  'onShow',
  'onHide',
  'onLaunch',
  'onPageNotFound',
  'onError'
];

export type OverrideWechatAppHooksCb = (method: string) => void;

export class OverrideWechatApp {
  private wechatOriginalApp: WechatMiniprogram.App.Constructor;

  public constructor() {
    this.wechatOriginalApp = getWxApp();
  }

  public initialize(AppHooksCb: OverrideWechatAppHooksCb): void {
    const _App = getWxApp();

    const wrapper = function (options: any) {
      proxyMethods.forEach(methodName => {
        const _originalHooks = options[methodName];
        const wrapperMethod = function (...args: any[]) {
          AppHooksCb(methodName);
          // 微信小程序启动时清理session级别的locationStorage
          if (methodName === 'onLaunch') {
            const res = wx.getStorageInfoSync();
            res.keys.forEach(key => {
              if (key.startsWith(sessionStorageKey) || key.startsWith(sessionStorageTimeKey)) {
                storage.remove(key);
              }
            });
          }
          return _originalHooks && _originalHooks.call(this, ...args);
        };
        options = {
          ...options,
          [methodName]: wrapperMethod
        };
      });

      _App(options);
    };

    overrideWxApp(wrapper);

  }

  public destroy(): void {
    overrideWxApp(this.wechatOriginalApp);
  }
}
