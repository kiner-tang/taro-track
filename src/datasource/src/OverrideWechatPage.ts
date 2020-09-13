/**
 * @date 2020-09-12
 * @author kinertang
 * @description 重写微信的Page方式，实现对小程序声明周期的拦截处理操作
 */

import { getWxComponent, getWxPage, Logger, overrideWxComponent, overrideWxPage } from '@kiner/taro-track-corejs';


// 需要代理的生命周期钩子，包含Page和Component的钩子
const proxyMethods = [
  "onShow",
  "onHide",
  "onReady",
  "onLoad",
  "onUnload",
  "created",
  "attached",
  "ready",
  "moved",
  "detached",
];

// 触发钩子的回调函数中的初始化参数
export interface OverrideWechatPageInitOptions {
  __route__?: string
  __isPage__?: boolean
  [key:string]: any
}

// 触发钩子是调用的回调函数类型
export type OverrideWechatPageHooksCb = (method: string, options: OverrideWechatPageInitOptions)=>void;

// 用于存储所有的回调函数
const pageHooksCbs: OverrideWechatPageHooksCb[] = [];

export class OverrideWechatPage {
  // 微信原生Page方法
  private readonly wechatOriginalPage: WechatMiniprogram.Page.Constructor;
  // 微信原生Component方法
  private readonly wechatOriginalComponent: WechatMiniprogram.Component.Constructor;
  // 是否使用taro框架
  private isTaro:boolean;

  public constructor(isTaro:boolean=true) {
    this.isTaro = isTaro;
    // 基于以后可能需要兼容头条、百度小程序需要，将所有操作原生微信小程序的操都独立抽离到单独的模块中进行维护，
    // 若以后需要兼容其他小程序，只需要在盖某块内部进行api动态指定切换即可
    // 保存微信原始Page对象，以便我们在销毁时恢复原状
    this.wechatOriginalPage = getWxPage();
    // 保存微信原始Component对象，以便我们在销毁时恢复原状
    this.wechatOriginalComponent = getWxComponent();
  }

  public initialize(pageHooksCb: OverrideWechatPageHooksCb): void {
    const _Page = getWxPage();
    const _Component = getWxComponent();
    // 将回调函数放入队列中，在触发原生生命周期钩子时依次调用
    pageHooksCbs.push(pageHooksCb);

    // console.info(`原始${this.isTaro?'Component':'Page'}对象`, pageHooksCbs, this.wechatOriginalPage);

    const self = this;

    // 根据是否使用Taro框架筛选需要代理的钩子函数
    // 若使用Taro则需代理组件的生命周期钩子，若使用原生小程序则代理Page的生命周期钩子
    const needProxyMethods = proxyMethods.filter(item=>this.isTaro?!item.startsWith('on'):item.startsWith('on'));

    /**
     * 实现代理Page|Component的逻辑
     * @param {OverrideWechatPageInitOptions} options
     * @returns {string}
     */
    const wrapper = function(options: OverrideWechatPageInitOptions){


      needProxyMethods.forEach(methodName=>{
        const _originalHooks = options[methodName];
        const wrapperMethod = function (...args: any[]) {
          pageHooksCbs.forEach((fn: OverrideWechatPageHooksCb)=>fn(methodName, options));
          return _originalHooks&&_originalHooks.call(this, ...args);
        };
        options = {
          ...options,
          [methodName]:wrapperMethod
        };
      });

      let res = "";
      if(self.isTaro){
        res = _Component(options);
      }else{
        _Page(options);
      }

      // 由于在Taro中，一切皆组件，我们需要知道当前组件是页面组件还是普通组件
      // 微信小程序原生的Component执行构造函数后会直接返回当前组件的路径，如：pages/index/index
      // 因此，我们可以将这个路径保存在我们的wrapper中，方便我们在外部判断当前组件是否是页面组件
      options.__router__ = wrapper.__route__ = res;
      options.__isPage__ = res.startsWith('pages/');

      // console.info(`重写微信小程序${self.isTaro?'Component':'Page'}对象`, options, res);

      return res;
    };

    wrapper.__route__ = '';
    wrapper.__isPage__ = false;


    // 重写微信原生Page|Component
    if(this.isTaro){
      overrideWxComponent(wrapper);
    }else{
      overrideWxPage(wrapper);
    }


  }

  /**
   * 重置微信原生方法
   */
  public destroy(): void {
    overrideWxPage(this.wechatOriginalPage);
    overrideWxComponent(this.wechatOriginalComponent);
  }
}
