/**
 * @date 2020-09-12
 * @author kinertang
 * @desrciption performance interface
 */

export enum MonitorEventName {
  // 用户行为
  OnUIError = "OnUIError",
  OnUIEvent = "OnUIEvent",
  OnPageView = "OnPageView",
  OnURLChange = "OnURLChange",
  OnHashChange = "OnHashChange",
  OnVisiableChange = "OnVisiableChange",

  // 页面性能
  PageLoadTime = "PageLoadTime",
  DOMLoadTime = "DOMLoadTime",
  TCPCompletedTime = "TCPCompletedTime",
  TCPConnectTime = "TCPConnectTime",
  DNSLookupTime = "DNSLookupTime",
  ResourceLoadTime = "ResourceLoadTime",
  OnResource = "OnResource",

  // OnNetworkTimeout = "OnNetworkTimeout",
};

/* 页面io指标 */
export enum MonitorIOType {
  OnDNSParseTime = "OnDNSParseTime",          // DNS解析耗时
  OnTCPSetUpTime = "OnTCPSetUpTime",          // TCP建立连接耗时
  OnConnectTime = "OnConnectTime",            // 请求耗时
  OnDOMLoadTime = "OnDOMLoadTime",            // DOM解析耗时
  OnPageLoadTime = "OnPageLoadTime",          // 从打开页面到所有的资源加载完成耗时
  OnResourceLoadTime = "OnResourceLoadTime",  // 统计页面打开时所有资源加载总耗时
  OnResource = "OnResource",                  // 单条页面资源加载耗时
  OnFirstPaint = "OnFirstPaint"               // 页面首次绘制耗时
};

/* 网络状态 */
export enum MonitorNetworkType {
  OnNetworkOnline = "OnNetworkOnline",
  OnNetworkOffline = "OnNetworkOffline",
  OnNetworkTypeChange = "OnNetworkTypeChange"
};

/* io指标回传参数 */
export interface MonitorIOEntity {
  DNSLookup: number;
  TCPConnected: number;
  RequestStart: number;
  ResponseStart: number;
  Duration: number;
  URI: string;
  Type: string;
  ResourceType: string;
  StatusCode: number;
};

/* 网络状态回传参数 */
export interface MonitorNetworkEntity {
  type: string;    // wifi/4g/3g...
};

/* io 指标监听函数原型 */
export interface MonitorIOListener {
  (data: MonitorIOEntity): void;
};

/* 网络状态监听函数原型 */
export interface MonitorNetworkListener {
  (data: MonitorNetworkEntity): void;
};

/* 监控url变化原形 */
export interface MonitorUrlChangeEntity {
  url: string
}

/* 入口类配置参数 */
export interface MonitorOptions {
  timeout?: number;   // 配置fetch/xmlhttprequest超时时间
  isTaro?: boolean
};

/* 入口类接口，所有的数据以事件的方式传播 */
export interface Monitor {
  on(type: MonitorIOType, callback: MonitorIOListener): void;
  // on(type: MonitorNetworkType, callback: MonitorNetworkListener): void;
  destroy(): void;
  getNavigationStartTime(): number;
};


/* 入口类接口，所有的数据以事件的方式传播 */
export interface WxMonitor {
  on(type: MonitorIOType, callback: MonitorIOListener): void;
  // on(type: MonitorNetworkType, callback: MonitorNetworkListener): void;
  destroy(): void;
};
