import { TaroTrackLoggerNamespace } from '@kiner/taro-track-common';

export class Logger {
  static logTpl = `[${TaroTrackLoggerNamespace}]`;
  static showLog = true;

  constructor(private namespace: string) {
    Logger.logTpl = `${Logger.logTpl}(${namespace}):`;
  }

  static getMessage(message: string): string {
    return `${Logger.logTpl}${message}`;
  }

  log(message: string, ...args: any[]): void {
    if(!Logger.showLog) return;
    console.groupCollapsed(Logger.getMessage(message));
    console.log(...args);
    console.groupEnd();
  }

  error(message: string, ...args: any[]): void {
    if(!Logger.showLog) return;
    console.groupCollapsed(Logger.getMessage(message));
    console.error(...args);
    console.groupEnd();
  }

  info(message: string, ...args: any[]): void {
    if(!Logger.showLog) return;
    console.groupCollapsed(Logger.getMessage(message));
    console.info(...args);
    console.groupEnd();
  }

  warn(message: string, ...args: any[]): void {
    if(!Logger.showLog) return;
    console.groupCollapsed(Logger.getMessage(message));
    console.warn(...args);
    console.groupEnd();
  }

}

//
// let logger = new Logger('testLogger');
// logger.log('log日志',{name: "kiner", age: 20}, "test");
