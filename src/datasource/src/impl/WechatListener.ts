/**
 * @author kinertang
 * @date 2020-09-12
 * @desrciption 微信小程序事件监听
 */

import {
  Listener,
  ListenerBackpass,
  ListenerEventCallbackType,
  ListenerEventType,
  ListenerOptions, OnWindowErrorBackpass
} from "@/datasource/src/inter/listener";
import {NQueue as Queue} from './Queue';
import { getWxCurrentHref, parseErrorMessage, toggleAppShow } from '@kiner/taro-track-corejs';


interface CompatibleCallback {
  (...args: any[]): void;
}


class EventEmitter {
  private callbacks: { [key: string]: CompatibleCallback[] };

  public constructor() {
    this.callbacks = {};
  }

  private getCallbacks(event: string): CompatibleCallback[] {
    return this.callbacks[event] || (this.callbacks[event] = []);
  }

  public on(event: string, callback: CompatibleCallback): EventEmitter {
    const callbacks: CompatibleCallback[] = this.getCallbacks(event);

    if (callbacks.indexOf(callback) < 1) {
      callbacks.push(callback);
    }

    return this;
  }

  public emit(event: string, ...data: any[]): EventEmitter {
    const callbacks: CompatibleCallback[] = this.getCallbacks(event);

    for (const callback of callbacks) {
      callback(data[0], data[1], data[2], data[3]);
    }

    return this;
  }
}

function consoleProxy(cb:(type:string, error: string)=>void){
  const { log, error } = console;

  // console.log = function (...args: any[]) {
  //   cb('log', args[0]);
  //   log.call(console, ...args);
  // };
  console.error = function (...args: any[]) {
    cb('error', args[0]);
    error.call(console, ...args);
  }
}


/** class Listener */
export class WechatListener implements Listener {
  private root: EventTarget;
  private types: ListenerEventType[];
  private queue: Queue<ListenerBackpass>;
  private emitter: EventEmitter;

  public constructor(options?: ListenerOptions) {
    const opts: ListenerOptions = options || {};

    this.root = opts.root;
    this.types = opts.types || [
      ListenerEventType.Click,
      ListenerEventType.Change
    ];
    this.queue = new Queue<ListenerBackpass>({ size: opts.size || 6 });
    this.emitter = new EventEmitter();

    this.inlitialize();
  }


  private inlitialize() {
    // 页面加载时就触发一个OnPageView事件
    // 让出主线程使用权，让调用者有机会绑定事件
    setTimeout(() => {
      this.emitter.emit(ListenerEventCallbackType.OnPageView, getWxCurrentHref());
    }, 0);

    // 由于微信小程序中不支持window.onerror,且wx.onError只支持同步方法错误捕获，无法捕获async-await的错误
    // 因此采用代理console.error的方式进行全局捕获报错
    consoleProxy((type, error)=>{

      const onWindowErrorBackpass: OnWindowErrorBackpass = parseErrorMessage(error);
      if (type === "error") {
        const backpass: ListenerBackpass[] = this.queue.get();
        this.queue.reset();
        this.emitter.emit(ListenerEventCallbackType.OnUIError, {
          backpass,
          error: onWindowErrorBackpass
        });
      }
    });


    // 对于url的监听统一在WechatMonitor.ts中进行



    // visiable change
    this.listenVisiableChange();

  }


  private getListenerBackpass(event: any): ListenerBackpass {
    const target: HTMLElement = event.target as any;
    const tag = target.tagName.toLowerCase();

    return {
      tag,
      eventType: event.type,
      url: location.href,
      cssPath: "",
      mark: ""
    };
  }


  private listenVisiableChange(): void {

    toggleAppShow((isShow => {
      this.emitter.emit(
        ListenerEventCallbackType.OnVisiable,
        !isShow
      );
    }));

  }

  public on(
    event: ListenerEventCallbackType,
    callback: CompatibleCallback
  ): void {
    this.emitter.on(event, callback);
  }
}
