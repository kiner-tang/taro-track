/**
 * @author kinertang
 * @date 2020-09-12
 * @description dolphin上报,需定义全局参数： _dolphin_app_name  _dolphin_app_version
 */
import {
  getBaseFields, WebAppType, WechatPerformance, WechatUserBeHavior,
  getBaseExtFields, OverrideWechatPage, CompAndPageHookMap, proxyWxLifeHooks, OverrideWechatPageInitOptions
} from '@kiner/taro-track-datasource';
import { getWxCurrentHref, Logger4Node, shortid } from '@kiner/taro-track-corejs';
import {
  TransporterConsole,
  WechatTransporter,
  TestELKLogServerHost,
  ELKLogServerHost,
  TransporterOptions
} from '@kiner/taro-track-transporter';
import { BaseDataType } from '@kiner/taro-track-common';
import { BaseExtField, BaseFields } from '@kiner/taro-track-datasource';


const logger = Logger4Node.create('TaroTrack:entry', {
  groupCollapsed: true
});

export enum TransporterType {
  Console = 'Console',
  Elk = 'Elk'
}

export interface InitOptions {
  appName?: string
  appVersion?: string
  baseUrl?: string
  transporter: TransporterType
  isTaro?: boolean
}

export { WechatTransporter, TestELKLogServerHost, ELKLogServerHost, TransporterConsole };

export type Transporter = TransporterConsole<any> | WechatTransporter<any>;

export function initTransporter<T extends BaseDataType>(transporter: TransporterType, initOptions: TransporterOptions): Transporter {
  switch (transporter) {
    case TransporterType.Console:
      return new TransporterConsole<T>();
    case TransporterType.Elk:
      return <TransporterConsole<any> | WechatTransporter<any>>WechatTransporter.create<T>(initOptions);
  }
}

/**
 * 使用默认的策略方案对页面相关事件进行自动监听
 * @param {InitOptions} opts
 */
export function initDolphin(opts: InitOptions) {

  const {appName, appVersion, baseUrl = TestELKLogServerHost} = opts;

  const AppName = appName || '_dolphin_app_name';
  const AppVersion = appVersion || '0.0.0';

  logger.success('初始化成功', opts);
  // console.log(`%ctaro-track初始化：${JSON.stringify(opts)}`, 'padding: 5px 10px; border-radius: 5px; background: brown; color: #FFFFFF;');

  // Datasource
  const perf = new WechatPerformance({
    app_name: AppName,
    app_version: AppVersion,
    pv_id: shortid(),
    ignored: [
      `https://xxx.xxx.com`
    ],
    isTaro: opts.isTaro
  });
  const ub = new WechatUserBeHavior({
    app_name: AppName,
    app_version: AppVersion,
    pv_id: shortid(),
    webAppType: WebAppType.normal,
    isTaro: opts.isTaro
  });


  // Transporter
  let perTransport;
  let ubTransport;
  //ubTransport = perTransport = new TransporterConsole();
  if (opts.transporter === TransporterType.Console) {
    ubTransport = perTransport = new TransporterConsole();
  } else {
    perTransport = WechatTransporter.create({
      baseUrl,
      query: {
        app_name: AppName,
        app_version: AppVersion,
        ev_type: 'client_perf'
      }
    });
    ubTransport = WechatTransporter.create({
      baseUrl,
      query: {
        app_name: AppName,
        app_version: AppVersion,
        ev_type: 'client_ub'
      }
    });
  }


  perf
    .pipe(perTransport);

  ub
    .pipe(ubTransport);
}

export interface InitAppletLifecycleOption extends InitOptions {
  showLog?: boolean
  pstInterval?: number
}

/**
 * 初始化微信小程序生命周期监听
 * @param {string | undefined} baseUrl     发送的日志服务器，默认为生产服务
 * @param {TransporterType} transporter    采用的上传通道方案是elk还是console
 * @param {string | undefined} appVersion  当前小程序版本
 * @param {string | undefined} appName     当前小程序的名称
 * @param {boolean} showLog                发送成功是否打印日志
 * @param {number} pstInterval             applet-pst事件循环上报时间间隔，默认为：5000
 * @param extraData                        额外参数，sdk中无法直接获取的字段，如appid等
 * @param allHooks
 * @param {{[p: string]: string}} extraData
 */
export function initAppletLifecycleListener(
    {baseUrl,
      isTaro,
      transporter,
      appVersion,
      appName,
      showLog = false,
      pstInterval = 5000
    }: InitAppletLifecycleOption,
    extraData: { [key: string]: string } = {},
    allHooks?:(tpr: Transporter, methodName: string, options: OverrideWechatPageInitOptions)=>{ [key: string]: string }
  ){

  const tpr: Transporter = initTransporter(transporter, {
    baseUrl: baseUrl,
    query: {
      app_name: appName,
      app_version: appVersion,
      ev_type: 'client_ub'
    }
  });

  let timer = null;


  const overrideWechatPage: OverrideWechatPage = new OverrideWechatPage(isTaro);

  const prevUrl: string = getWxCurrentHref();

  // 对页面的onLoad和onReady进行监听
  overrideWechatPage.initialize(async (methodName: string, options) => {
    if (!options.__isPage__) {
      return;
    }

    const newData: Record<string, any> = allHooks&&allHooks(tpr, methodName, options);

    extraData = {...extraData, ...newData};

    // const hooksName = CompAndPageHookMap[methodName];

    const openTime: number = Date.now();
    const baseExtFields: BaseExtField = getBaseExtFields(extraData);
    const baseFields: BaseFields = await getBaseFields(extraData);

    const extraExt = extraData.ext || {};

    function sendPv() {
      const now = Date.now();
      const sendData = {
        ev: 'applet-pv',
        ...baseFields,
        ...extraData,
        time: now,
        ext: {
          ...baseExtFields,
          ...extraExt,
          time_in: now
        }
      };

      tpr.send(sendData, () => showLog && logger.info(`applet-pv上报成功`, sendData));
    }

    function sendPst() {
      const now = Date.now();
      const sendPstData = {
        ev: 'applet-pst',
        ...baseFields,
        ...extraData,
        time: now,
        ext: {
          ...baseExtFields,
          ...extraExt,
          time: now - openTime,
          url: getWxCurrentHref()
        }
      };
      tpr.send(sendPstData, () => showLog && logger.info(`applet-pst上报成功`, sendPstData));
    }

    function sendPvOut() {
      const now = Date.now();
      const sendPvOutData = {
        ev: 'applet-pvout',
        ...baseFields,
        ...extraData,
        time: now,
        pl: baseFields.url,
        ext: {
          ...baseExtFields,
          ...extraExt,
          time_out: now,
          url: baseFields.url
        }
      };
      tpr.send(sendPvOutData, () => showLog && logger.info(`applet-pvout上报成功`, sendPvOutData));
    }


    // console.log(`taro-track/entry[${methodName}]`);
    switch (CompAndPageHookMap[methodName]) {
      case proxyWxLifeHooks.onReady:
      case proxyWxLifeHooks.ready:
        // 若触发onLoad或attached时当前url与缓存的url不一样，说明发生页面跳转，触发pvout
        if(prevUrl&&prevUrl!==getWxCurrentHref()){
          sendPvOut();
        }
        sendPv();
        timer = setInterval(() => {

          sendPst();

        }, pstInterval);
        break;
      case proxyWxLifeHooks.onUnload:
      case proxyWxLifeHooks.detached:
      // case proxyWxLifeHooks.onHide:
      //   console.log(`taro-track/entry:${proxyWxLifeHooks.onUnload}`);
        sendPvOut();
        break;
    }
  });
}



