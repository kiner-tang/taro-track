
import {
  Listener as IListener,
  ListenerBackpass,
  ListenerEventCallbackType,
  ListenerOptions
} from "@/datasource/src/inter/listener";
import { MonitorNetworkListener } from "@/datasource/src/inter/monitor";
import { WechatListener } from "@/datasource/src/impl/WechatListener";
import { BaseFields, getBaseFields } from "@/datasource/src/impl/BaseFields";
import { Pipeline } from '@kiner/taro-track-common';
import { getWxNetworkType, onWxNetworkStatusChange } from '@kiner/taro-track-corejs';


export interface UserBehaviorProperties extends BaseFields {
  pv_id: string;
  user_id?: string;
  event_name: string;  // OnUIError\OnUIEvent\OnPageView\OnURLChange\OnHashChange
  type?: string;       // click\change...
  message?: string;
}


export interface UserBeHaviorOptions {
  app_name?: string;
  app_version?: string;
  pv_id: string;

  // web应用类型
  // hashspa：以hash作为url的spa应用
  // statespa: 以pushState/replaceState方式作为url的spa应用
  // "hashspa" | "statespa" | "normal"
  webAppType?: WebAppType;
  listenerOptions?: ListenerOptions;
  isTaro?: boolean
};

export enum UserBeHaviorEventName {
  // 用户行为
  OnUIError = "OnUIError",
  OnUIEvent = "OnUIEvent",
  OnPageView = "OnPageView",
  OnURLChange = "OnURLChange",
  OnHashChange = "OnHashChange",
  OnVisiableChange = "OnVisiableChange",

  // 网络行为
  OnNetworkTypeChange = "OnNetworkTypeChange",
  OnNetworkOnline = "OnNetworkOnline",
  OnNetworkOffline = "OnNetworkOffline"
};

export enum WebAppType {
  hashspa = "hashspa",
  statespa = "statespa",
  normal = "normal"
};


export class WechatUserBeHavior implements Pipeline<UserBehaviorProperties>{
  private options: UserBeHaviorOptions;
  private callbacks: {
    [key: string]: MonitorNetworkListener[]
  }
  private listener: IListener;
  private registered: Partial<UserBehaviorProperties>;
  protected next: Pipeline<UserBehaviorProperties>;

  public constructor(opts: UserBeHaviorOptions) {
    this.options = { ...opts };
    this.listener = new WechatListener({ ...opts.listenerOptions, isTaro: opts.isTaro });
    this.initialize();
  }

  private initialize(): void {
    this.onUIEvent();
    this.onUIError();
    this.onPageView();
    this.onVisiableEvent();
    this.createNetworkObserver();
  }

  /**
   * 页面元素事件
   */
  private onUIEvent(): void {
    const { app_name, app_version, pv_id } = this.options;

    this.listener.on(
      ListenerEventCallbackType.OnUIEvent,
      async (backpass: ListenerBackpass) => {
        const base: BaseFields = await getBaseFields();
        const properties: UserBehaviorProperties = {
          ...base,
          app_name,
          app_version,
          pv_id,
          event_name: UserBeHaviorEventName.OnUIEvent,
          type: backpass.eventType,
          message: JSON.stringify(backpass)
        };

        this.push([properties]);
      }
    );
  }

  /**
   * 页面可见事件
   */
  private onVisiableEvent(): void {
    const { app_name, app_version, pv_id } = this.options;

    this.listener.on(
      ListenerEventCallbackType.OnVisiable,
      async (hiddenState: boolean) => {
        const base: BaseFields = await getBaseFields();
        const properties: UserBehaviorProperties = {
          ...base,
          app_name,
          app_version,
          pv_id,
          event_name: UserBeHaviorEventName.OnVisiableChange,
          message: "hidden:" + hiddenState,
        };

        this.push([properties]);
      }
    );
  }

  /**
   * 页面错误事件
   */
  private onUIError(): void {
    const { app_name, app_version, pv_id } = this.options;

    this.listener.on(
      ListenerEventCallbackType.OnUIError,
      async ({ backpass, error }) => {
        const base: BaseFields = await getBaseFields();
        const properties: UserBehaviorProperties = {
          ...base,
          app_name,
          app_version,
          event_name: UserBeHaviorEventName.OnUIError,
          message: JSON.stringify((<any[]>backpass).concat(error)),
          pv_id,
        };

        this.push([properties]);
      }
    );
  }

  /**
   * 页面访问事件
   */
  private onPageView(): void {
    const { app_name, app_version, pv_id } = this.options;

    this.listener.on(
      ListenerEventCallbackType.OnPageView,
      async (url: string) => {
        const base: BaseFields = await getBaseFields();
        const properties: UserBehaviorProperties = {
          ...base,
          app_name,
          app_version,
          url,
          event_name: UserBeHaviorEventName.OnPageView,
          pv_id,
        };

        this.push([properties]);
      }
    );
  }



  private async observeNetwork(network: WechatMiniprogram.OnNetworkStatusChangeCallbackResult): Promise<void>{
    const { app_name, app_version, pv_id } = this.options;
    const base: BaseFields = await getBaseFields();
    const properties: UserBehaviorProperties = {
      ...base,
      app_name,
      app_version,
      pv_id,
      event_name: network.isConnected?UserBeHaviorEventName.OnNetworkOnline:UserBeHaviorEventName.OnNetworkOffline,
      message: network.networkType || "unknow"
    };

    this.push([properties]);
  }

  private async createNetworkObserver(): Promise<void> {

    const networkTypeResult = await getWxNetworkType();

    this.observeNetwork({
      isConnected: networkTypeResult.networkType!=='none',
      networkType: networkTypeResult.networkType
    });


    onWxNetworkStatusChange(result => this.observeNetwork(result));

  }

  public register(data: Partial<UserBehaviorProperties>): void {
    this.registered = {
      ...this.registered,
      ...data
    };
  }
  public unRegister(keys: string[]): void {
    keys.forEach(function (key: string) {
      if (this.registered.keys) {
        delete this.registered[key];
      }
    });
  }

  public async push(data: UserBehaviorProperties[]): Promise<void> {
    const pushData = {
      ...this.registered,
      ...data[0]
    }
    return this.next&&this.next.push([pushData]);
  }

  public pipe(next: Pipeline<UserBehaviorProperties>): Pipeline<UserBehaviorProperties> {
    this.next = next;
    return next;
  }
}
