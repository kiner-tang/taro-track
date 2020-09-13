/**
 * @date 2020-09-12
 * @author kinertang
 * @desrciption 事件监听接口对象
*/

export enum ListenerEventType {
  ViewTap = "ViewTap",
  InputInput = "InputInput",
  InputFocus = "InputFocus",
  InputBlur = "InputBlur",
  InputConfirm = "InputConfirm",
  ImageError = "ImageError",
}

export enum ListenerEventCallbackType {
  OnViewTap = "OnViewTap",
  OnImageLoadResult = "onImageLoadResult",
  OnInputEvent = "onInputEvent"
}

/**
 * 事件回传数据
 */
export interface ListenerBackpass {
  tag: string;
  eventType: string;
  url: string;
  cssPath: string;
  value: string;// 若是点击元素，则为元素文本、若为图片加载，则为图片url、若为文本框操作，则为文本框的值
  md5ClassName: string;// md5className,用户快速定位元素
  errorMsg?: string;// 若图片加载报错，则为报错详细信息

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


export interface WxListener {
  on(event: ListenerEventCallbackType.OnViewTap, callback: (backpass: ListenerBackpass) => void): void;
  on(event: ListenerEventCallbackType.OnImageLoadResult, callback: (backpass: ListenerBackpass) => void): void;
  on(event: ListenerEventCallbackType.OnInputEvent, callback: (backpass: ListenerBackpass) => void): void;
}
