/**
 * @date 2020-09-12
 * @author kinertang
 * @description 微信小程序监控性能类
 */

import { MonitorIOType, Monitor as IMonitor, MonitorEventName, MonitorIOEntity } from "@/datasource/src/inter/monitor";
import { Monitor } from "@/datasource/src/WechatMonitor";
import { BaseFields, getBaseFields } from "@/datasource/src/impl/BaseFields";
import { Pipeline } from '@kiner/taro-track-common';


export interface PerformanceProperties extends BaseFields {
  pv_id: string;
  user_id?: string;
  event_name: MonitorEventName;
  type?: string; // xmlhttprequest\fetch\img\css\script
  resource_uri?: string;
  dns_lookup?: number;
  tcp_connected?: number;
  request_start?: number;
  response_start?: number;
  duration: number;
}

export interface PerformanceOptions {
  app_name: string;
  app_version: string;

  // 不需要上报数据的资源url，可以string、string数组、或正则
  // 一定要将数据服务忽略，不然就形成上报死循环了
  // http://a.com
  // http://a.com/b
  ignored?: Array<string | RegExp>;

  // 设置fetch请求超时时间
  timeout?: number;

  // page view id
  pv_id: string;
  isTaro?: boolean
}


export class WechatPerformance implements Pipeline<PerformanceProperties> {
  private options: PerformanceOptions;
  private monitor: IMonitor;
  private registered: Partial<PerformanceProperties>;
  protected next: Pipeline<PerformanceProperties>;

  public constructor(options: PerformanceOptions) {
    this.options = {
      app_name: "",
      app_version: "",
      timeout: 5000,
      ignored: [],
      ...options
    };
    this.monitor = Monitor.create({
      timeout: options.timeout,
      isTaro: this.options.isTaro
    });

    this.initialize();
  }

  private initialize(): void {
    this.onPerformanceEvent();
    this.onResource();
  }

  /**
   * 判断传入的uri是否需要忽略
   *
   * @param {string} uri
   * @return {boolean}
   */
  private isIgnoreURI(uri: string): boolean {
    if (this.options.ignored.length < 1) {
      return false;
    }

    return this.options.ignored.some((location: string | RegExp): boolean => {
      if (typeof location === "string") {
        return uri.indexOf(location) === 0;
      }

      return location.test(uri);
    });
  }

  /*
   * 监听页面性能指标：
   * 1. OnDNSParseTime         域名解析耗时
   * 2. OnTCPSetUpTime         TCP建立连接耗时
   * 3. OnConnectTime          TCP传输耗时
   * 4. OnDOMLoadTime          DOM加载完成耗时，此时页面状态： 所有的样式表已加载、 DOM解析完成。
   * 5. OnPageLoadTime         页面加载完成耗时，此时页面状态：所有的资源加载完成，包括样式、脚本、媒体。
   * 6. OnResourceLoadTime     页面所有资源加载总耗时。
   * 7. OnResource             当有资源请求时会触发该事件。
   */
  private onPerformanceEvent(): void {
    const measures: [MonitorIOType, MonitorEventName][] = [
      [MonitorIOType.OnPageLoadTime, MonitorEventName.PageLoadTime],
      [MonitorIOType.OnDOMLoadTime, MonitorEventName.DOMLoadTime],
      [MonitorIOType.OnConnectTime, MonitorEventName.TCPConnectTime],
      [MonitorIOType.OnTCPSetUpTime, MonitorEventName.TCPCompletedTime],
      [MonitorIOType.OnDNSParseTime, MonitorEventName.DNSLookupTime],
      [MonitorIOType.OnResourceLoadTime, MonitorEventName.ResourceLoadTime]
    ];
    const { app_name, app_version, pv_id } = this.options;

    for (const [event, name] of measures) {
      this.monitor.on(event, async (entity: MonitorIOEntity) => {
        const base: BaseFields = await getBaseFields();
        const properties: PerformanceProperties = {
          ...base,
          app_name,
          app_version,
          event_name: name,
          pv_id,
          duration: entity.Duration,
        };

        this.push([properties]);
      });
    }
  }

  /**
   * 资源请求
   */
  private onResource(): void {
    const { app_name, app_version, pv_id } = this.options;

    this.monitor.on(MonitorIOType.OnResource, async (entity: MonitorIOEntity) => {
      if (this.isIgnoreURI(entity.URI)) {
        return;
      }

      const base: BaseFields = await getBaseFields();
      const properties: PerformanceProperties = {
        ...base,
        app_name,
        app_version,
        pv_id,
        event_name: MonitorEventName.OnResource,
        type: entity.ResourceType,
        resource_uri: entity.URI,
        dns_lookup: entity.DNSLookup,
        tcp_connected: entity.TCPConnected,
        request_start: entity.RequestStart,
        response_start: entity.ResponseStart,
        duration: entity.Duration,
        status: entity.StatusCode,
      };

      this.push([properties]);
    });
  }


  public register(data: Partial<PerformanceProperties>): void {
    this.registered = {
      ...this.registered,
      ...data
    };
  }
  public unRegister(keys: string[]): void {
    keys.forEach(function (key: string) {
      if (this.registered.keys) {
        delete this.registered[key];
      }
    });
  }

  public async push(data: PerformanceProperties[]): Promise<void> {
    const pushData = {
      ...this.registered,
      ...data[0]
    };
    return this.next&&this.next.push([pushData]);
  }

  public pipe(next: Pipeline<PerformanceProperties>): Pipeline<PerformanceProperties> {
    this.next = next;
    return next;
  }
}
