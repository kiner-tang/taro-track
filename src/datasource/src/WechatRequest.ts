/**
 * @date 2020-09-12
 * @author kinertang
 * @description 拦截wx.request，只拦截错误情况。
 * 错误情况包括： timeout、 error等
 */

import {
  OnWechatNetworkCallback,
  PerformanceMonitorIOOverride,
  WechatNetworkRecordType,
  NetworkRecordStatus
} from './inter/network';
import { canIUse, getWxRequest, overrideWxRequest, WxReviseTimer as ReviseTimer } from '@kiner/taro-track-corejs';
import RequestOption = WechatMiniprogram.RequestOption;
import RequestSuccessCallbackResult = WechatMiniprogram.RequestSuccessCallbackResult;
import GeneralCallbackResult = WechatMiniprogram.GeneralCallbackResult;


type GlobalScopeRequest = (option: WechatMiniprogram.RequestOption) => WechatMiniprogram.RequestTask;

export class OverrideWechatRequest implements PerformanceMonitorIOOverride {
  private request: GlobalScopeRequest;

  public constructor() {
    this.request = getWxRequest();
  }

  public initialize(callback: OnWechatNetworkCallback, timeout?: number): void {
    const ListenTimeout: boolean = typeof timeout === 'number' && timeout >= 0;
    const _request: GlobalScopeRequest = getWxRequest();

    const wrapper = function (options: RequestOption): WechatMiniprogram.RequestTask {
      const start: number = ReviseTimer.start();
      const method = options && options.method ? options.method.toUpperCase() : 'GET';
      const {url} = options;
      const id = ListenTimeout
        ? setTimeout(onTimeout, timeout)
        : null;
      let doTimeout: boolean = false;

      // invoke once
      function onTimeout() {
        if (doTimeout) {
          return;
        }

        doTimeout = true;
        ReviseTimer.end(start, (duration) => {
          callback({
            url,
            method,
            duration,
            status: NetworkRecordStatus.Timeout,
            type: WechatNetworkRecordType.request
          });
        });

      }

      const _success = options.success;
      const _fail = options.fail;

      // 拦截success大于400的结果并上报
      options.success = function (res: RequestSuccessCallbackResult) {
        if ((res.statusCode >= 400 && canIUse('2.11.0')) || !canIUse('2.11.0')) {
          if (doTimeout) {
            return;
          }

          if (id !== null) {
            clearTimeout(id);
          }

          ReviseTimer.end(start, (duration) => {
            callback({
              url,
              method,
              duration,
              status: res.statusCode,
              type: WechatNetworkRecordType.request
            });
          });

        }
        _success && _success(res);

        return res;
      };

      // 拦截fail
      options.fail = function (reason: GeneralCallbackResult) {
        if (doTimeout) {
          return;
        }

        if (id !== null) {
          clearTimeout(id);
        }

        ReviseTimer.end(start, (duration) => {

          callback({
            url,
            method,
            duration,
            status: NetworkRecordStatus.Error,
            type: WechatNetworkRecordType.request
          });
        });

        _fail && _fail(reason);

        return reason;
      };

      return _request(options);

    };

    overrideWxRequest(wrapper);

  }

  public destroy(): void {
    overrideWxRequest(this.request);
  }
}
