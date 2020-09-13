/**
 * @date 2020-09-12
 * @author kinertang
 * @description 拦截wx.download，只拦截错误情况。
 * 错误情况包括： timeout、 error等
 */


import { canIUse, getWxDownload, overrideWxDownload, WxReviseTimer as ReviseTimer } from '@kiner/taro-track-corejs';
import {
  OnWechatNetworkCallback,
  PerformanceMonitorIOOverride,
  WechatNetworkRecordType,
  NetworkRecordStatus
} from '@/datasource/src/inter/network';
import DownloadFileOption = WechatMiniprogram.DownloadFileOption;
import DownloadFileSuccessCallbackResult = WechatMiniprogram.DownloadFileSuccessCallbackResult;
import GeneralCallbackResult = WechatMiniprogram.GeneralCallbackResult;


type GlobalScopeDownload = (option: WechatMiniprogram.DownloadFileOption) => WechatMiniprogram.DownloadTask;

export class OverrideWechatDownload implements PerformanceMonitorIOOverride {
  private downloadFile: GlobalScopeDownload;

  public constructor() {
    this.downloadFile = getWxDownload();
  }

  public initialize(callback: OnWechatNetworkCallback, timeout?: number): void {
    const ListenTimeout: boolean = typeof timeout === 'number' && timeout >= 0;
    const _downloadFile: GlobalScopeDownload = getWxDownload();

    const wrapper = function (options: DownloadFileOption): WechatMiniprogram.DownloadTask {
      const start: number = ReviseTimer.start();
      const {url} = options;
      const id = ListenTimeout
        ? setTimeout(onTimeout, timeout)
        : null;
      let doTimeout: boolean = false;

      function onTimeout() {
        if (doTimeout) {
          return;
        }

        doTimeout = true;
        ReviseTimer.end(start, (duration) => {
          callback({
            url,
            duration,
            status: NetworkRecordStatus.Timeout,
            type: WechatNetworkRecordType.download
          });
        });
      }


      const _success = options.success;
      const _fail = options.fail;

      options.success = function (res: DownloadFileSuccessCallbackResult) {
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
              duration,
              status: res.statusCode,
              type: WechatNetworkRecordType.download
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
            duration,
            status: NetworkRecordStatus.Error,
            type: WechatNetworkRecordType.download
          });
        });


        _fail && _fail(reason);

        return reason;
      };


      return _downloadFile(options);
    };

    overrideWxDownload(wrapper);
  }

  public destroy(): void {
    overrideWxDownload(this.downloadFile);
  }
}
