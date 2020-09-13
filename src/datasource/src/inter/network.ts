/**
 * @date 2020-09-12
 * @date kinertang
 * 小程序中需要监控的网络请求方法
 */
export enum WechatNetworkRecordType{
    request="request",
    download="download",
    upload="upload"
}


export interface NetworkRecord {
    url: string;
    duration: number;
    method?: string;/* 微信小程序upload时无method */
    status: number;
    type: WechatNetworkRecordType;
}

export interface OnWechatNetworkCallback {
    (record: NetworkRecord): void;
}


export interface PerformanceMonitorIOOverride {
    initialize(callback: OnWechatNetworkCallback, timeout?: number): void;
    destroy(): void;
}


export enum NetworkRecordStatus {
    Timeout = -1,
    Error = -2
}
