/**
 * @date 2020-09-12
 * @author kinertang
 * @description 微信小程序监控指标入口类
 */
import {
  MonitorEventName,
  MonitorIOListener,
  MonitorIOType,
  MonitorNetworkListener,
  MonitorNetworkType,
  MonitorOptions,
  Monitor as IMonitorResult, MonitorIOEntity, MonitorNetworkEntity, MonitorUrlChangeEntity
} from "@/datasource/src/inter/monitor";
import { NetworkRecord, PerformanceMonitorIOOverride } from "@/datasource/src/inter/network";
import { OverrideWechatPage } from "@/datasource/src/OverrideWechatPage";
import { OverrideWechatRequest } from "@/datasource/src/WechatRequest";
import { OverrideWechatDownload } from "@/datasource/src/WechatDownload";
import { OverrideWechatUpload } from "@/datasource/src/WechatUpload";
import { canIUse, createWxPerformanceObserver, getWxPerformance, getWxReferrer, storage } from '@kiner/taro-track-corejs';
import { proxyWxLifeHooks } from '@/src/datasource';



export type WechatMonitorCallbackType = MonitorIOType | MonitorNetworkType | MonitorEventName;
export type WechatMonitorCallback = MonitorIOListener | MonitorNetworkListener;

const DefaultMonitorOptions: MonitorOptions = {
  timeout: null
};

interface MonitorCallbackMaps {
  [key: string]: WechatMonitorCallback[];
}

const wechatCurrentUrlStorageKey = 'wechatCurrentUrlStorageKey';

export class Monitor implements IMonitorResult {
  private static ins: IMonitorResult = null;

  public static create(options?: MonitorOptions): IMonitorResult {
    if (Monitor.ins !== null) {
      Monitor.ins.destroy();
    }

    Monitor.ins = new Monitor(options);
    return Monitor.ins;
  }

  private callbacks: MonitorCallbackMaps;
  private performance: Performance;
  private timing: PerformanceTiming;
  private options: MonitorOptions;

  private observer: PerformanceObserver;
  private wechatRequest: PerformanceMonitorIOOverride;
  private wechatUpload: PerformanceMonitorIOOverride;
  private wechatDownload: PerformanceMonitorIOOverride;
  private overrideWechatPage: OverrideWechatPage;

  private constructor(options?: MonitorOptions) {
    this.callbacks = {} as MonitorCallbackMaps;
    this.options = {
      ...(DefaultMonitorOptions as object),
      ...(options as object)
    };

    this.performance = getWxPerformance();
    this.timing = performance.timing;
    this.initialize();
  }

  public getNavigationStartTime(): number {

    return Math.floor(this.timing.navigationStart || -1);
  }

  /**
   * 注册回事件调函数
   */
  public on(
    type: WechatMonitorCallbackType,
    callback: WechatMonitorCallback
  ): IMonitorResult {
    if (this.callbacks[type]) {
      this.callbacks[type].push(callback);
    } else {
      this.callbacks[type] = <WechatMonitorCallback[]>[callback];
    }

    return this;
  }

  /**
   * 触发事件，并传入参数
   */
  private emit(
    type: WechatMonitorCallbackType,
    entity: MonitorIOEntity | MonitorNetworkEntity | MonitorUrlChangeEntity
  ): void {
    const callbacks: WechatMonitorCallback[] = this.callbacks[type];

    if (!callbacks) {
      return;
    }

    for (const cb of callbacks) {
      try {
        (cb as any)(entity);
      } catch (e) {
        // TODO
      }
    }
  }

  /**
   * 初始化：
   * 1. 创建资源加载Observer。
   * 2. 待DOM加载完成，执行onDOMLoad。
   * 3. 待资源加载完成，执行onPageLoad。
   */
  private initialize(): void {
    // 微信小程序只有2.11.0 以上才支持PerformanceObserver，因此只有这个sdk版本以上的才能够使用监听
    this.createResourceObserver();

    // TODO 经过试验微信小程序的wx.request、wx.downloadFile、wx.uploadFile三个api受微信限制，只能获取调用，无法更改重写，因此要另寻方案实现对着三个api的监听
    // Cannot set property uploadFile of #<Object> which has only a getter;at "pages/index/index" page lifeCycleMethod onLoad function
    // TypeError: Cannot set property uploadFile of #<Object> which has only a getter

    this.wechatRequest = new OverrideWechatRequest();
    this.wechatDownload = new OverrideWechatDownload();
    this.wechatUpload = new OverrideWechatUpload();
    this.overrideWechatPage = new OverrideWechatPage(this.options.isTaro);


    // 对微信小程序的访问网络资源进行监听
    this.wechatRequest.initialize(
      (record: NetworkRecord) => this.emitNetworkRecord(record),
      this.options.timeout
    );
    // 对小程序上传网络资源行为进行监听
    this.wechatUpload.initialize(
      (record: NetworkRecord) => this.emitNetworkRecord(record),
      this.options.timeout
    );
    // 对小程序下载网络资源进行监听
    this.wechatDownload.initialize(
      (record: NetworkRecord) => this.emitNetworkRecord(record),
      this.options.timeout
    );


    // 对页面的onLoad和onReady进行监听
    this.overrideWechatPage.initialize((methodName: string, options) => {
      if(!options.__isPage__){
        return;
      }
      switch (methodName) {
        case proxyWxLifeHooks.onLoad:
          this.onPageLoad();
          // 当页面显示时判断url是否与上一个url不同，如果不同，说明打开了新页面，触发urlchange,并将当前url存入storage替换上一个url
          const prevUrl = storage(wechatCurrentUrlStorageKey);
          const href = getWxReferrer();
          if(prevUrl!==href){
            this.emitUrlChange(href);
            storage(wechatCurrentUrlStorageKey, href);
          }
          break;
        case proxyWxLifeHooks.onReady:
          this.onPageReady();
          break;
        case proxyWxLifeHooks.onShow:

          break;
      }
    });
  }

  public emitUrlChange(url: string): void {
    this.emit(MonitorEventName.OnURLChange, {url});
  }

  public destroy(): void {
    this.observer && this.observer.disconnect();

    this.wechatRequest && this.wechatRequest.destroy();
  }

  private emitNetworkRecord(record: NetworkRecord): void {
    this.emit(MonitorIOType.OnResource, {
      DNSLookup: -1,
      TCPConnected: -1,
      RequestStart: -1,
      ResponseStart: -1,
      Duration: record.duration,
      URI: record.url,
      Type: "",
      ResourceType: record.type,
      StatusCode: record.status
    });
  }

  /* 当页面创建时执行，触发OnDNSParseTime、OnTCPSetUpTime、OnConnectTime、OnDOMLoadTime */
  private onPageLoad(): void {
    this.emit(
      MonitorIOType.OnDNSParseTime,
      Monitor.createIOEntityByDuration(this.getDNSLookupTime())
    );
    this.emit(
      MonitorIOType.OnTCPSetUpTime,
      Monitor.createIOEntityByDuration(this.getTCPSetUpTime())
    );
    this.emit(
      MonitorIOType.OnConnectTime,
      Monitor.createIOEntityByDuration(this.getTCPConnectTime())
    );
    this.emit(
      MonitorIOType.OnDOMLoadTime,
      Monitor.createIOEntityByDuration(this.getDOMLoadTime())
    );
  }

  /* 当页面渲染完毕时执行，触发OnPageLoadTime、OnResourceLoadTime */
  private onPageReady(): void {
    this.emit(
      MonitorIOType.OnPageLoadTime,
      Monitor.createIOEntityByDuration(this.getPageLoadTime())
    );
    this.emit(
      MonitorIOType.OnResourceLoadTime,
      Monitor.createIOEntityByDuration(this.getResourceLoadTime())
    );
  }

  private static createIOEntityByDuration(duration: number): MonitorIOEntity {
    return {
      DNSLookup: -1,
      TCPConnected: -1,
      RequestStart: -1,
      ResponseStart: -1,
      Duration: duration,
      URI: "",
      Type: "",
      ResourceType: "",
      StatusCode: 200
    };
  }

  /**
   * 获取域名解析时间
   */
  private getDNSLookupTime(): number {
    return Math.floor(
      this.timing.domainLookupEnd - this.timing.domainLookupStart
    );
  }

  /**
   * 获取TCP建立连接时间
   */
  private getTCPSetUpTime(): number {
    return Math.floor(this.timing.connectEnd - this.timing.connectStart);
  }

  /**
   * 获取TCP传输耗时
   */
  private getTCPConnectTime(): number {
    return Math.floor(this.timing.responseEnd - this.timing.responseStart);
  }

  /**
   * 获取DOM加载完成时间，此时页面状态：
   * 1. 所有的样式表已加载。
   * 2. DOM解析完成。
   */
  private getDOMLoadTime(): number {
    return Math.floor(
      this.timing.domContentLoadedEventStart - this.timing.navigationStart
    );
  }

  /**
   * 获取页面加载完成时间，此时页面状态：
   * 1. DOM解析完成
   * 2. 所有的资源加载完成，包括样式、脚本、媒体。
   */
  private getPageLoadTime(): number {
    return Math.floor(this.timing.domComplete - this.timing.responseStart);
  }

  /**
   * 统计页面打开时所有资源加载总耗时
   */
  private getResourceLoadTime(): number {
    const timing: PerformanceResourceTiming[] = <PerformanceResourceTiming[]>(
      this.performance.getEntriesByType("resource")
    );
    const total: number = timing.reduce(function (
      p: number,
      c: PerformanceResourceTiming
      ): number {
        return p + (c.responseEnd - c.startTime);
      },
      0);

    return Math.floor(total);
  }

  /**
   * 创建资源加载观察者
   */
  private createResourceObserver(): void {


    if(canIUse('2.11.0')){
      this.observer = createWxPerformanceObserver(
        (entries: PerformanceObserverEntryList): void => {
          const records: PerformanceResourceTiming[] = <
            PerformanceResourceTiming[]
            >entries.getEntries();
          const io: MonitorIOEntity[] = [];

          for (const r of records) {
            this.emit(MonitorIOType.OnResource, {
              DNSLookup: Math.floor(r.domainLookupEnd - r.domainLookupStart),
              TCPConnected: Math.floor(r.connectEnd - r.connectStart),
              RequestStart: Math.floor(r.requestStart - r.connectEnd),
              ResponseStart: Math.floor(r.responseStart - r.connectEnd),
              Duration: Math.floor(r.duration),
              URI: r.name,
              Type: Monitor.getResourceType(r),
              ResourceType: r.initiatorType,
              StatusCode: 200
            });
          }
        }
      );

      // 目前支持获取以下几类性能指标：
      // 类别	名称              (entryType)	指标
      // 路由	navigation	      route, appLaunch
      // 渲染	render	          firstRender
      // 脚本	script	          evaluateScript

      this.observer&&this.observer.observe({entryTypes: ["load", "fetch","request"]});
    }

  }

  /**
   * 解析资源类型
   */
  private static getResourceType(record: PerformanceResourceTiming): string {
    if (record.entryType) {
      return record.entryType;
    }

    if (record.name && record.name.length > 0) {
      return record.name.replace(/^(.+)?\.(.+)$/, "$2");
    }

    return "";
  }
}
