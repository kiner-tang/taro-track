/**
 * @date 2020-09-12
 * @author kinertang
 * @description 小程序需要监控的声明周期
 */
export enum proxyWxLifeHooks{
  "onShow"="onShow",
  "onHide"="onHide",
  "onReady"="onReady",
  "onLoad"="onLoad",
  "onUnload"="onUnload",
  "created"="created",
  "attached"="attached",
  "ready"="ready",
  "moved"="moved",
  "detached"="detached",

}


type CompAndPageHookMapStruct = {
  [key:string]: proxyWxLifeHooks
}


export const CompAndPageHookMap:CompAndPageHookMapStruct = {
  "onShow": proxyWxLifeHooks.onShow,
  "onHide": proxyWxLifeHooks.onHide,
  "onReady": proxyWxLifeHooks.onReady,
  "onLoad": proxyWxLifeHooks.onLoad,
  "onUnload": proxyWxLifeHooks.onUnload,
  "created": proxyWxLifeHooks.onLoad,
  "attached": proxyWxLifeHooks.attached,
  "ready": proxyWxLifeHooks.onReady,
  "moved": proxyWxLifeHooks.moved,
  "detached": proxyWxLifeHooks.onUnload,
};

