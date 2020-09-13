import { TaroTrackLibName, TaroTrackLoggerNamespace } from '@kiner/taro-track-common';
import { packageName, packageNameCore, packageNameDatasource } from '@/src/plugins/src/taro/config';

// 微信小程序运行时常量
const constantSymbol = '////injectConstant////';
const constantCore = `
  exports.config = {
    ${constantSymbol}
  }
`;
export function injectConstant() {
  return constantCore.replace(constantSymbol,`
    TaroTrackLoggerNamespace: ${JSON.stringify(TaroTrackLoggerNamespace)},
    TaroTrackLibName: ${JSON.stringify(TaroTrackLibName)}
  `);
}

// 获取目标元素位置信息的方法
export function getBoundingClientRectSource(): string{
  return `
    exports.getBoundingClientRect = function (element) {
      return new Promise((reslove) => {
        const query = wx.createSelectorQuery();
        query.selectAll(element).boundingClientRect();
        query.selectViewport().scrollOffset();
        query.exec(res => reslove({ boundingClientRect: res[0], scrollOffset: res[1] }));
      });
    }
  `;
}

// 判断点击的坐标是否落在目标元素上
export function getIsClickTrackAreaSource(): string{
  return `
    exports.isClickTrackArea = function(clickInfo, boundingClientRect, scrollOffset){
      if (!boundingClientRect) return false;
      const { x, y } = clickInfo.detail; // 点击的x y坐标
      const { left, right, top, height } = boundingClientRect;
      const { scrollTop } = scrollOffset;
      return left < x && x < right && scrollTop + top < y && y < scrollTop + top + height;
    }
  `;
}

// 获取当前页面的方法
export function getActivePageSource(): string{
  return `
    exports.getActivePage = function(){

      const curPages = getCurrentPages();
      if (curPages.length) {
        return curPages[curPages.length - 1];
      }
      return {};

    }
  `;
}

// 获取上一个页面的方法
export function getPrevPageSource(): string{
  return `
    exports.getPrevPage = function(){

      const curPages = getCurrentPages();
      if (curPages.length > 1) {
        return curPages[curPages.length - 2];
      }
      return {};

    }
  `;
}

// TaroTrack注入代码通用日志方法
export function injectLogger() {
  return `
    exports.logger = function(msg,...rest){
      const label = '['+exports.config.TaroTrackLoggerNamespace+':Plugin] '+msg;
      console.groupCollapsed(label);
      rest.forEach(item=>{
        console.log(item);
      });
      console.groupEnd();
    }
  `;
}

// 定义在注入代码中触发行为进行上报的方法
export function injectTransporter() {
  return `
    exports.transporter = function(transporterType, baseOptions){
      exports.logger("transporterOption: %s", JSON.stringify(baseOptions))
      const dolphinEntry = __webpack_require__("./node_modules/${packageName}/entry/es/index.js");
      const tpr = dolphinEntry.initTransporter(transporterType, {
        baseUrl: baseOptions.baseUrl,
        query: {
          app_name: baseOptions.query.app_name,
          app_version: baseOptions.query.app_version,
          ev_type: 'web_stat'
        }
      });
      return tpr;
    }
  `;
}

// 注入内部上报通用字段
export function commonBaseField() {
  return `
    exports.commonBaseField = async function(){

      const common = __webpack_require__("../node_modules/${packageNameDatasource}/es/index.js");
      console.log(common);
      const { getBaseFields } = common;
      const { getWxCurrentHref, getWxSystemInfo }  = __webpack_require__("../node_modules/${packageNameCore}/es/index.js");
      const baseFields = await getBaseFields();
      const wxSystemInfo = getWxSystemInfo();
      return {
        baseFields,
        wxSystemInfo
      };
    }
  `;
}
// 运行时获取用户信息，包括但不限于openId和unionId
export function getUserInfo(cookieKey: string="AUTH-INFO") {
  return `
    exports.getUserInfo = function(){
      const { storage }  = __webpack_require__("../node_modules/${packageNameCore}/es/index.js");
      return storage(${JSON.stringify(cookieKey)});
    }
  `;
}


/**
 * 内部调用的核心代码
 * @type {string}
 */
export const TaroTrackInjectLibCore = `
  ${injectConstant()}
  ${getActivePageSource()}
  ${getBoundingClientRectSource()}
  ${getIsClickTrackAreaSource()}
  ${getPrevPageSource()}
  ${injectLogger()}
  ${injectTransporter()}
  ${commonBaseField()}
  ${getUserInfo()}
`;


/**
 * 注入微信开发者工具库，方便开发者在微信开发者工具中调用
 * @type {string}
 */
export const injectLibInWxApi = `

const timer = setInterval(()=>{

  if(wx&&!wx.TaroTrack){
    clearInterval(timer);

    wx.TaroTrack = {
      version: '0.0.1',
      help(name){
        const version = {"name":"version","API": "wx.TaroTrack.version","用法":"wx.TaroTrack.version", "说明": "当前TaroTrackLib的版本号"};
        const help = {"name":"help","API": "wx.TaroTrack.help([API Name])","用法":"wx.TaroTrack.help()", "说明": "显示TaroTrack的所有API用法,或根据API的name筛选显示的用户"};
        const showViewBySelector = {"name":"showViewBySelector","API": "wx.TaroTrack.showViewBySelector(className)","用法":"wx.TaroTrack.showViewBySelector('.md5-1234')", "说明": "可以根据元素的md5作为class快速定位目标元素"};
        const cancelShowView = {"name":"cancelShowView","API": "wx.TaroTrack.cancelShowView","用法":"wx.TaroTrack.cancelShowView()", "说明": "取消当前选中的元素"};

        let res = [version,help,showViewBySelector,cancelShowView]
        if(!!name){
          res = res.filter(item=>item.name===name);
        }
        console.table(res);
      },
      showViewBySelector(selector){
        const query = wx.createSelectorQuery();
        const nodes = query.selectAll(selector)
        nodes.boundingClientRect();
        query.selectViewport().scrollOffset();
        nodes.fields({
          dataset: true,
          size: true,
          scrollOffset: true,
          properties: ['scrollX', 'scrollY'],
          computedStyle: ['margin', 'backgroundColor'],
          context: true,
        });
        query.exec(function(res){
          exports.logger('选中元素相关信息[分别为：元素的rect信息（boundingClientRect）、视窗信息（selectViewport）、元素详细字段信息（fields）]:',...res);
        });
        const curPages = getCurrentPages();
        curPages[curPages.length-1].setData({dolphinActiveElement: selector.substring(1)})
        wx.pageScrollTo({selector: selector});
        return "[wx.TaroTrack]选中元素【"+selector+"】执行成功";
      },
      cancelShowView(){
        const curPages = getCurrentPages();
        curPages[curPages.length-1].setData({dolphinActiveElement: ''})
      }
    };
  }

},60);

`;

// 这个库文件将会注入到微信小程序中，便于我们的注入代码能在运行时调用这些方法
export const TaroTrackInjectLib = `
  ${TaroTrackInjectLibCore}
  ${injectLibInWxApi}
`;
