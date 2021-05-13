import { InitAppletLifecycleOption, TransporterType } from '@kiner/track/entry';

export const appName = process.env.appName;
export const appVersion = process.env.appVersion;
export const appId = process.env.appId;
export const appNameZH = process.env.appNameZH;
export const openId = process.env.openId;
export const unionId = process.env.unionId;

export const isProd = process.env.NODE_ENV === "production";

export const dolphinBaseConfig: InitAppletLifecycleOption = {
  appName: appName,
  appVersion: appVersion,
  baseUrl: isProd ? "https://prod.log.com" : "https://test.log.com",
  transporter: isProd ? TransporterType.Elk : TransporterType.Console,
  showLog: true,
  isTaro: true,
  isPst: false
};
