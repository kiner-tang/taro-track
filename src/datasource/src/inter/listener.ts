/**
 * @date 2020-09-12
 * @author kinertang
 * @desrciption 事件监听接口对象
*/

export enum ListenerEventType {
  Click = "click",
  Change = "change",
  Focus = "focus",
  MouseOver = "mouseover",
  MouseOut = "mouseout",
  TouchStart = "touchstart",
  TouchMove = "touchmove",
  TouchEnd = "touchend"
}

export enum ListenerEventCallbackType {
  OnUIEvent = "OnUIEvent",
  OnUIError = "OnUIError",
  OnURLChange = "OnURLChange",
  OnHashChange = "OnHashChange",
  OnPageView = "OnPageView",
  OnVisiable = "OnVisiable"
}

/**
 * 事件回传数据
 */
export interface ListenerBackpass {
  tag: string;
  eventType: string;
  url: string;
  cssPath: String;
  mark: string;
}

export interface OnWindowErrorBackpass {
  message: string;
  source: string;
  line: number;
  column: number;
}

/**
 * 初始化参数
 */
export interface ListenerOptions {
  // 监听的目标对象，默认为document
  root?: EventTarget;
  // 监听的类型
  types?: ListenerEventType[];
  size?: number;
  isTaro?: boolean;
}

export interface ListenerOnUIErrorBackpass {
  backpass: ListenerBackpass[];
  error: OnWindowErrorBackpass;
}

export interface Listener {
  on(event: ListenerEventCallbackType.OnUIEvent, callback: (backpass: ListenerBackpass) => void): void;
  on(event: ListenerEventCallbackType.OnUIError, callback: (backpass: ListenerOnUIErrorBackpass) => void): void;
  on(event: ListenerEventCallbackType.OnPageView, callback: (url: string) => void): void;
  on(event: ListenerEventCallbackType.OnURLChange, callback: (url: string) => void): void;
  on(event: ListenerEventCallbackType.OnHashChange, callback: (url: string, hash: string) => void): void;
  on(event: ListenerEventCallbackType.OnVisiable, callback: (url: boolean | string) => void): void;
}
