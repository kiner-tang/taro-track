import { Wrapper } from './wrapper';
import { getBoundingClientRect, isClickTrackArea, getActivePage } from './helper';

export enum InjectConfig {
  method,
  element,
  comMethod
}

export interface ConfigStruct {
  element?: string
  method?: string
  dataKeys: string[]
  dataset?: any
}

export interface TrackConfigStruct {
  path: string
  elementTracks: ConfigStruct[]
  methodTracks: ConfigStruct[]
  comMethodTracks: ConfigStruct[]
}

export type TrackConfigListStruct = TrackConfigStruct[];

export interface TrackerOptions {
  tracks: TrackConfigListStruct
  isUsingPlugin: boolean
}

export class Tracker extends Wrapper {
  private tracks: TrackConfigListStruct;
  constructor(opts: TrackerOptions) {
    const {tracks, isUsingPlugin} = opts

    super(isUsingPlugin);
    // 埋点配置信息
    this.tracks = tracks;
    // 自动给每个page增加elementTracker方法，用作元素埋点
    this.addPageMethodExtra(this.elementTracker());
    // 自动给page下预先定义的方法进行监听，用作方法执行埋点
    this.addPageMethodWrapper(this.methodTracker());
    // 自动给page component下预先定义的方法进行监听，用作方法执行埋点
    this.addComponentMethodWrapper(this.comMethodTracker());
  }

  elementTracker():(e:any)=>void {
    // elementTracker变量名尽量不要修改，因为他和wxml下的名字是相对应的
    const elementTracker = (e: any) => {
      const tracks = this.findActivePageTracks(InjectConfig.element);
      const { data } = getActivePage();
      tracks.forEach((track) => {
        getBoundingClientRect(track.element).then((res) => {
          res.boundingClientRect.forEach((item) => {
            const isHit = isClickTrackArea(e, item, res.scrollOffset);
            track.dataset = item.dataset;
            // TODO 将元素的事件上报
            console.log(`点中元素：${track.element}`, item.dataset, data, res);
            // isHit && report(track, data);
          });
        });
      });
    };
    return elementTracker;
  }

  methodTracker() {
    return (page:any, component: any, methodName: string, args:any={}) => {
      const tracks = this.findActivePageTracks(InjectConfig.method);
      const { data } = getActivePage();
      const { dataset } = args.currentTarget || {};
      tracks.forEach((track) => {
        if (track.method === methodName) {
          track.dataset = dataset;
          // TODO 将元素的事件上报
          // report(track, data);
          // this.emitter.emit(ListenerEventCallbackType.OnUIEvent, backpass);
          console.log(`页面方法调用：${track.element}`, dataset, data);
        }
      });
    };
  }

  comMethodTracker() {
    return (page:any, component:any, methodName:string, args:any = {}) => {
      const tracks = this.findActivePageTracks(InjectConfig.comMethod);
      const data = component.data;
      const { dataset } = args.currentTarget || {};
      tracks.forEach((track) => {
        if (track.method === methodName) {
          track.dataset = dataset;
          // report(track, data);
          console.log(`组件方法调用：${track.element}`, dataset, data);
        }
      });
    };
  }

  /**
   * 获取当前页面的埋点配置
   * @param {String} type 返回的埋点配置，options: method/element/comMethod
   * @returns {Object}
   */
  findActivePageTracks(type: InjectConfig): ConfigStruct[] {
    const { route } = getActivePage();
    const pageTrackConfig = this.tracks.find(item => item.path === route);
    let tracks: ConfigStruct[] = [];

    if(!pageTrackConfig){
      return tracks;
    }

    if (type === InjectConfig.method) {
      tracks = pageTrackConfig.methodTracks;
    } else if (type === InjectConfig.element) {
      tracks = pageTrackConfig.elementTracks;
    }else if (type === InjectConfig.comMethod) {
      tracks = pageTrackConfig.comMethodTracks
    }
    return tracks;
  }
}
