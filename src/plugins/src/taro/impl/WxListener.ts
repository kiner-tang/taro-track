/**
 * @author kinertang
 * @date 2020-09-12
 * @desrciption 微信小程序事件监听
 */

import {NQueue as Queue} from '@kiner/taro-track-datasource';
import { WxListener as IListener, ListenerBackpass, ListenerEventCallbackType, ListenerEventType, ListenerOptions } from '@/src/plugins/src/taro/inter/listener';


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


/** class Listener */
export class WxListener implements IListener {
  private root: EventTarget;
  private types: ListenerEventType[];
  private queue: Queue<ListenerBackpass>;
  private emitter: EventEmitter;

  public constructor(options?: ListenerOptions) {
    const opts: ListenerOptions = options || {};

    this.root = opts.root;
    this.types = opts.types || [
      ListenerEventType.ViewTap,
      ListenerEventType.InputInput
    ];
    this.queue = new Queue<ListenerBackpass>({ size: opts.size || 6 });
    this.emitter = new EventEmitter();

    this.inlitialize();
  }


  private inlitialize() {


  }

  public on(
    event: ListenerEventCallbackType,
    callback: CompatibleCallback
  ): void {
    this.emitter.on(event, callback);
  }
}
