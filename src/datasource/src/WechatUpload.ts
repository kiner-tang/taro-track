/**
 * @date 2020-09-12
 * @author kinertang
 * @description 拦截wx.upload，只拦截错误情况。
 * 错误情况包括： timeout、 error等
 */

import {
  OnWechatNetworkCallback,
  PerformanceMonitorIOOverride,
  WechatNetworkRecordType,
  NetworkRecordStatus
} from "./inter/network";
import { canIUse, getWxUpload, overrideWxUpload, WxReviseTimer as ReviseTimer } from '@kiner/taro-track-corejs';
import UploadFileOption = WechatMiniprogram.UploadFileOption;
import UploadFileSuccessCallbackResult = WechatMiniprogram.UploadFileSuccessCallbackResult;
import GeneralCallbackResult = WechatMiniprogram.GeneralCallbackResult;


type GlobalScopeUpload = (option: WechatMiniprogram.UploadFileOption)=>WechatMiniprogram.UploadTask;

export class OverrideWechatUpload implements PerformanceMonitorIOOverride {
  private uploadFile: GlobalScopeUpload;

  public constructor() {
    this.uploadFile = getWxUpload();
  }

  public initialize(callback: OnWechatNetworkCallback, timeout?: number): void {
    const ListenTimeout: boolean = typeof timeout === "number" && timeout >= 0;
    const _uploadFile: GlobalScopeUpload = getWxUpload();

    const wrapper = function (options:UploadFileOption): WechatMiniprogram.UploadTask {
      const start: number = ReviseTimer.start();
      const { url } = options;
      const id = ListenTimeout
        ? setTimeout(onTimeout, timeout)
        : null;
      let doTimeout: boolean = false;

      function onTimeout() {
        if (doTimeout) {
          return;
        }

        doTimeout = true;
        ReviseTimer.end(start, (duration)=> {
          callback({
            url,
            duration,
            status: NetworkRecordStatus.Timeout,
            type: WechatNetworkRecordType.upload
          });
        });
      }


      const _success = options.success;
      const _fail = options.fail;

      options.success = function (res:UploadFileSuccessCallbackResult) {
        if ((res.statusCode >= 400 && canIUse('2.11.0'))||!canIUse('2.11.0')) {
          if (doTimeout) {
            return;
          }

          if (id !== null) {
            clearTimeout(id);
          }

          ReviseTimer.end(start, (duration)=> {
            callback({
              url,
              duration,
              status: res.statusCode,
              type: WechatNetworkRecordType.upload
            });
          });
        }
        _success&&_success(res);
        return res;
      };

      // 拦截fail
      options.fail = function (reason:GeneralCallbackResult) {
        if (doTimeout) {
          return;
        }

        if (id !== null) {
          clearTimeout(id);
        }

        ReviseTimer.end(start, (duration)=> {
          callback({
            url,
            duration,
            status: NetworkRecordStatus.Error,
            type: WechatNetworkRecordType.upload
          });
        });

        _fail&&_fail(reason);

        return reason;
      };


      return _uploadFile(options);
    };

    overrideWxUpload(wrapper);
  }

  public destroy(): void {
    overrideWxUpload(this.uploadFile);
  }
}
