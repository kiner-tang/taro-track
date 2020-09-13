

import { Constant } from "@/datasource/src/impl/Constant";
import { BaseDataType } from '@kiner/taro-track-common';
import { getWxCurrentHref, getWxNetworkType, getWxReferrer, getWxSystemInfo, guid } from '@kiner/taro-track-corejs';

export interface BaseFields extends BaseDataType {
  time: number;
  app_name: string;
  app_version: string;
  distinct_id: string;
  session_id: string;
  system_name: string;
  system_version: string;
  device_brand: string;
  device_model: string;
  device_name: string;
  browser: string;
  browser_version: string;
  browser_agent: string;
  screen_dpi: number;
  screen_pixel: string;
  url: string;
  referrer: string;
  client_ip: string;
  network: string;
  carrier: string;
}


export function getCarrier(): string {
  return "unknow";
}

const constant = new Constant();

export enum ResType {
  PAGE=1,
  VIDEO=2
}

export interface BaseExtField extends BaseDataType{
  'page_unique_id': string, // 页面唯一id
  'open_id': string, // 用户openId
  'url': string, // 当前页面原始路径
  'time'?: number, // 页面停留时长,具体到毫秒时间戳
  'app_id': string, // 小程序id
  'app_name': string, // 小程序名称
  'terminal': string, // 终端类型 (如：iphone6)s
  'res_type'?: ResType, // 资源类型（1-页面，2-视频）
  'ui'?: string// unionId
  'pl'?: string// 当前页面url
  'os'?: string// 系统
}

export interface AppletBaseInfo {
  app_name?: string,
  app_version?: string,
  open_id?: string,
  app_id?: string,
  business_app_id?: string
  ui?:string
}

export function getBaseExtFields(baseInfo: AppletBaseInfo={}): BaseExtField {
  const wxSystemInfo = getWxSystemInfo();
  return {
    'open_id': baseInfo.app_id||"",
    'page_unique_id': `${baseInfo.open_id||guid()}${Date.now()}`,
    'url': getWxCurrentHref(),
    'app_id': baseInfo.app_id||"",
    'app_name': baseInfo.app_name||"",
    'terminal': wxSystemInfo.originalOs.model,
    'res_type': ResType.PAGE
  }
}

export async function getBaseFields(baseInfo: AppletBaseInfo={}): Promise<BaseFields> {
  const wxSystemInfo = getWxSystemInfo();
  const ScreenPixel = `${wxSystemInfo.originalOs.screenWidth}*${wxSystemInfo.originalOs.screenHeight}`;
  const DistinctID = constant.getDistinctID();
  const SessionID = constant.getSessionID();
  return {
    time: new Date().valueOf(),
    app_name: baseInfo.app_name||"",
    app_version: baseInfo.app_version||"",
    distinct_id: DistinctID,
    session_id: SessionID,
    system_name: wxSystemInfo.originalOs.system,
    system_version: wxSystemInfo.originalOs.version,
    device_brand: wxSystemInfo.originalOs.brand,
    device_model: wxSystemInfo.originalOs.model,
    device_name: wxSystemInfo.originalOs.platform,
    browser: wxSystemInfo.originalOs.model,
    browser_version: wxSystemInfo.originalOs.SDKVersion,
    browser_agent: "",
    screen_dpi: -1,
    screen_pixel: ScreenPixel,
    url: getWxCurrentHref(),
    referrer: getWxReferrer(),
    client_ip: "",
    network: (await getWxNetworkType()).networkType,
    carrier: getCarrier(),
    ui: baseInfo.ui,
    pl: getWxCurrentHref(),
    os: wxSystemInfo.osInfo()
  };
}
