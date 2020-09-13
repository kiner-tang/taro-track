import {
  TaroTrackElementClassName, TaroTrackLibName, TaroTrackLoggerNamespace, TaroTrackPageEvent
} from '@kiner/taro-track-common';


import { filterWXMLTaroTrackAttr, WXMLHelper } from '@/src/plugins/src/taro/WXMLHelper';
import { createWxModuleSourceFragment } from '@/src/plugins/src/taro/WxMoudleSourceFragment';
import { TaroFileManager } from '@/src/plugins/src/taro/TaroFileManager';
// @ts-ignore
import { json2wxml } from 'wxml2json';
import { wxml2json } from './tools/wxml2json';
import { packageName } from '@/src/plugins/src/taro/config';
import { ELKLogServerHost, TestELKLogServerHost } from '@kiner/taro-track-entrypoint';
import { userInfo } from 'os';
import { Logger4Node } from '@kiner/taro-track-corejs';
import { TaroTrackPluginInitOptions } from '@/src/plugins/src/taro/TaroTrackPlugin';
import { TaroTrackInjectLib } from '@/src/plugins/src/taro/TaroTrackInjectLib';

const minify = require('uglify-js').minify;

const miniFileReg = /[\n\t\r]/g;

const logger: Logger4Node = new Logger4Node(TaroTrackLoggerNamespace, {
  groupCollapsed: false
});

/**
 * 用于往taro编译过后的wxml、js等文件中注入相关业务代码实现一些特定功能
 */
export class TaroTrackSourceInjector {
  private tfm: any;

  constructor(stats: any, private TaroTrackPluginInitOptions: TaroTrackPluginInitOptions) {
    this.initial(stats, this.TaroTrackPluginInitOptions).catch(reason=>{
      logger.error('【TaroTrackPlugin】TaroTrackSourceInjector初始化失败', reason);
    });
  }

  async initial(stats: any, hooks: TaroTrackPluginInitOptions) {
    this.TaroTrackPluginInitOptions = hooks;
    logger.info('=========================TaroTrack Plugins============================');
    logger.info('【TaroTrackPlugin】初始化...');
    await this.initInjector(stats);
    logger.info('【TaroTrackPlugin】完成！');
    logger.info('=========================TaroTrack Plugins============================\n');
  }

  /**
   * 往wxml文件中注入事件捕获者
   * @param root
   * @returns {any}
   */
  injectTaroTrackEventCaptorInPageRoot(root: any): any {
    let rootAttrs;
    if (!root.attr) {
      root.attr = {};
    }
    rootAttrs = root.attr;
    rootAttrs['capture-bind:tap'] = TaroTrackPageEvent['capture-bind:tap'];

    return root;
  }

  /**
   * 在wxml中为每个真实的元素插入一个用于事件统计监听的class，
   * 方便根据用户当前点击的坐标，匹配对应class的元素
   * @param roots
   */
  injectTaroTrackElementClassNameInWXML(roots: any): Promise<any> {

    return new Promise<any>(resolve => {
      WXMLHelper.findWXMLElement(roots, ((elementName: string, element: any) => {
        if (!element.attr) {
          element.attr = {};
        }
        let elementAttrs = element.attr;
        let elementClass = elementAttrs['class'] || '';

        elementAttrs['class'] = `${elementClass} ${TaroTrackElementClassName}`;

      }), true);
      resolve(roots);
    });
  }

  /**
   * 注入图片onload代码监听代码
   * @param roots
   * @returns {Promise<any>}
   */
  injectTaroTrackImageOnLoadInWXML(roots: any): Promise<any> {


    return new Promise<any>(resolve => {
      let rootsString = JSON.stringify(roots);
      WXMLHelper.findElementAll(roots, 'image').then(res => {
        res.forEach(img => {


          let imgStr = JSON.stringify(img);

          // 保存用户定义的事件监听
          const bindload = img.attr.bindload;
          const binderror = img.attr.binderror;


          // 将用户定义的事件监听保存在标签的dataset中，方便之后获取
          let i;

          (i = img) && (i = (i.attr || {}));

          i['data-original-onload-method'] = bindload;
          i['data-original-onerror-method'] = binderror;
          i['data-image-src'] = i.src;
          // 将相关的事件调用的方法改为我们注入的方法名
          // 注：sdk会在调用我们注入的方法时调用用户自定义的事件监听，因此，无需担心影响用户自己注册的事件
          i.bindload = TaroTrackPageEvent['bindload'];
          i.binderror = TaroTrackPageEvent['binderror'];

          // console.log(imgStr, rootsString.indexOf(JSON.stringify(img)));

          // 源码字符串替换
          rootsString = rootsString.replace(imgStr, JSON.stringify(img));


        });

        // 将源码转换成json对象
        roots = JSON.parse(rootsString);

        // 重新输出文件前，将一些临时属性删除
        filterWXMLTaroTrackAttr(roots);

        resolve(roots);

      });

    });

  }

  /**
   * 注入文本框事件监听代码
   * TODO 暂时不支持taro-ui的input的输入监听
   * @param roots
   * @returns {Promise<any>}
   */
  injectTaroTrackInputEventInWXML(roots: any): Promise<any> {

    return new Promise<any>(resolve => {
      let rootsString = JSON.stringify(roots);
      WXMLHelper.findElementAll(roots, 'input').then(res => {
        res.forEach(input => {

          let inputStr = JSON.stringify(input);

          const bindinput = input.attr.bindinput;
          const bindfocus = input.attr.bindfocus;
          const bindblur = input.attr.bindblur;
          const bindconfirm = input.attr.bindconfirm;
          // const bindkeyboardheightchange = input.attr.bindkeyboardheightchange;


          let i;

          (i = input) && (i = (i.attr || {}));

          i['data-original-input-method'] = bindinput;
          i['data-original-focus-method'] = bindfocus;
          i['data-original-blur-method'] = bindblur;
          i['data-original-confirm-method'] = bindconfirm;
          // i['data-original-keyboardheightchange-method'] = bindkeyboardheightchange;
          i['data-input-name'] = i.name;
          i['data-input-placeholder'] = i.placeholder;
          i.bindinput = TaroTrackPageEvent['bindinput'];
          i.bindfocus = TaroTrackPageEvent['bindfocus'];
          i.bindblur = TaroTrackPageEvent['bindblur'];
          i.bindconfirm = TaroTrackPageEvent['bindconfirm'];
          // i.bindkeyboardheightchange = TaroTrackPageEvent['bindkeyboardheightchange'];


          rootsString = rootsString.replace(inputStr, JSON.stringify(input));


        });

        roots = JSON.parse(rootsString);

        // 重新输出文件前，将一些临时属性删除
        filterWXMLTaroTrackAttr(roots);

        // console.log(JSON.stringify(roots, null , 4));

        resolve(roots);

      });

    });

  }

  /**
   * 在页面js中插入公共库文件代码
   * @returns {string}
   */
  injectTaroTrackLibJs(): string {
    const core = createWxModuleSourceFragment(`
      ${TaroTrackInjectLib}
    `);
    return core;
  }

  /**
   * 在taro Page中插入方法
   * @param {string} path                           js文件路径
   * @param {string} source                         js文件源代码
   * @param {string} injectMethodSource             事件实现源代码
   * @param {string} injectRegisterEventSource      事件注册源代码
   * @param {any} injectPageData                    注入页面数据
   * @returns {string}
   */
  injectTaroTrackPageEventMethod(path: string, source: string, injectMethodSource: string, injectRegisterEventSource: string, injectPageData: any= {}): string {
    const componentPath = path.replace(/\.js$/, '');

    // 压缩代码
    const res = minify(source, {
      compress: false,
      keep_fnames: false,
      mangle: false
    });
    source = res.code;

    const pageDataKeys = Object.keys(injectPageData).map(item=>`"${item}"`);
    let pageDataKeyString = '';
    if(pageDataKeys.length!==0){
      pageDataKeyString += `,${pageDataKeys.join(",")}`;
    }

    let pageDataInitString = '';
    if(pageDataKeys.length!==0){
      let pageDataString = JSON.stringify(injectPageData);
      pageDataInitString = `;this.setState(${pageDataString})`;
    }


    const regFragment1 = `(\\./src/${componentPath}.tsx\\?taro&type=script&parse=PAGE&.*_this\\.\\$usedState=\\[[^\\]]*)`;
    const regFragment2 = `(.*)`;
    const regFragment3 = `(_createClass\\(\\w*,\\s*\\[)`;
    const regFragment4 = `(.*\\{key:"_constructor",value:function _constructor\\(.*\\)\\{.*this\\.\\$\\$refs=new\\s*_taroWeapp2\\.default\\.RefsArray)(\\}\\},\\{key)`;
    const regFragment5 = `(.*_class\\.\\$\\$events\\s*=\\s*\\[)`;
    const regFragment6 = `(.*componentPath\\s*=\\s*"${componentPath}",[_\\w\\d]*\\);)`;

    const jsSourceReg = new RegExp(`${regFragment1}${regFragment2}${regFragment3}${regFragment4}${regFragment5}${regFragment6}`);
    const injectLibReg = new RegExp(`(,\\[\\[)(".*",?)*(\\]\\]\\]\\);)$`);

    // console.log(jsSourceReg.exec(res.code));


    source = source.replace(jsSourceReg, `$1${pageDataKeyString}$2$3${injectMethodSource}$4${pageDataInitString}$5$6${injectRegisterEventSource}$7`);

    // 在页面js中添加库文件依赖
    source = source.replace(injectLibReg, `$1$2,"${TaroTrackLibName}"$3`);


    return source;
  }
  /**
   * 在taro-ui的组件js中插入方法
   * @param {string} path                           js文件路径
   * @param {string} source                         js文件源代码
   * @param {string} injectMethodSource             事件实现源代码
   * @param {string} injectRegisterEventSource      事件注册源代码
   * @param {any} injectPageData                    注入页面数据
   * @returns {string}
   */
  injectTaroTrackNpmComponentEventMethod(path: string, source: string, injectMethodSource: string, injectRegisterEventSource: string, injectPageData: any= {}): string {
    // const componentPath = path.replace(/\.js$/, '');

    // 压缩代码
    const res = minify(source, {
      compress: false,
      keep_fnames: false,
      mangle: false
    });
    source = res.code;

    const pageDataKeys = Object.keys(injectPageData).map(item=>`"${item}"`);
    let pageDataKeyString = '';
    if(pageDataKeys.length!==0){
      pageDataKeyString += `,${pageDataKeys.join(",")}`;
    }

    let pageDataInitString = '';
    if(pageDataKeys.length!==0){
      let pageDataString = JSON.stringify(injectPageData);
      pageDataInitString = `;this.setState(${pageDataString})`;
    }


    const regFragment1 = `(_this\\.\\$usedState=\\[[^\\]]*)`;
    const regFragment2 = `(.*)`;
    const regFragment3 = `(_createClass\\(\\w*,\\s*\\[)`;
    const regFragment4 = `(.*\\{key:"_constructor",value:function _constructor\\(.*\\)\\{.*this\\.\\$\\$refs=new\\s*_taroWeapp2\\.default\\.RefsArray)(\\}\\},\\{key)`;
    const regFragment5 = `(.*_class\\.\\$\\$events\\s*=\\s*\\[)`;
    // const regFragment6 = `(.*componentPath\\s*=\\s*"${componentPath}",[_\\w\\d]*\\);)`;

    const jsSourceReg = new RegExp(`${regFragment1}${regFragment2}${regFragment3}${regFragment4}${regFragment5}`);
    const injectLibReg = new RegExp(`(,\\[\\[)(".*",?)*(\\]\\]\\]\\);)$`);

    // console.log(jsSourceReg.test(source));

    source = source.replace(jsSourceReg, `$1${pageDataKeyString}$2$3${injectMethodSource}$4${pageDataInitString}$5$6${injectRegisterEventSource}`);

    // 在页面js中添加库文件依赖
    source = source.replace(injectLibReg, `$1$2,"${TaroTrackLibName}"$3`);


    return source;
  }


  /**
   * 获取注入的事件监听代码
   * @returns {{injectSourceForDefineEvent: string; injectSourceForRegisterEvent: string}}
   */
  private eventFragment(): {injectSourceForDefineEvent: string, injectSourceForRegisterEvent: string}{
    const options = this.TaroTrackPluginInitOptions.transporterOptions;

    // logger.info("debug: %s", JSON.stringify(options));
    // logger.info("debug: %s", JSON.stringify(options.appName));
    // logger.info("debug: %s", JSON.stringify(options.appVersion));

    // 以下为将注入到页面js中的用于进行相关事件统计的代码片段
    const TaroTrackEventCollectionCore = `
       const _es = __webpack_require__("./${TaroTrackLibName}.js");
       const { data } = _es.getActivePage();
       const hitTargets = [];
       _es.getBoundingClientRect(".${TaroTrackElementClassName}").then(async (res) => {
          res.boundingClientRect.forEach(async (item) => {
            const isHit = _es.isClickTrackArea(e, item, res.scrollOffset);
            const dataset = item.dataset;
            if(isHit){
              hitTargets.push({
                elem: item,
                dataset,
                pageData: data
              })
            }

          });

          const tpr = _es.transporter(${JSON.stringify(options.transporterType)}, {
             baseUrl: ${JSON.stringify(options.env==="production"?ELKLogServerHost:TestELKLogServerHost)},
             query: {
               app_name: ${JSON.stringify(options.appName)},
               app_version: ${JSON.stringify(options.appVersion)},
               ev_type: 'web_stat'
             }
          });
          const {baseFields, wxSystemInfo} = await _es.commonBaseField();
          const userInfo = _es.getUserInfo(${JSON.stringify(options.cookieKey)});
          const curTarget = hitTargets[hitTargets.length-1];
          console.log('===>', curTarget);
          tpr.send({
            ...baseFields,
            ev: 'et',
            v: ${JSON.stringify(options.appVersion)},
            app_name: ${JSON.stringify(options.appName)},
            app_version: ${JSON.stringify(options.appVersion)},
            ui: userInfo.unionId,
            ext: {
              csspath: curTarget.dataset.taroTrackCssPath,
              TaroTrackMd5: curTarget.dataset.taroTrackMd5,
              page_unique_id: userInfo.openId+'${JSON.stringify(Date.now())}', // 页面唯一id
              open_id: userInfo.openId, // 用户openId
              url: baseFields.pl, // 当前页面原始路径
              time: Date.now(), // 页面停留时长,具体到毫秒时间戳
              app_id: ${JSON.stringify(options.appId)}, // 小程序id
              app_name: ${JSON.stringify(options.appNameZH)}, // 小程序名称
              terminal: wxSystemInfo.osInfo(), // 终端类型 (如：iphone6)s
              res_type: 1 // 资源类型（1-页面，2-视频）
            }
          });
          // TODO 将元素的事件上报
          _es.logger('点中目标元素', hitTargets);
        });
    `;

    const injectSourceImageOnload = `
              const _es = __webpack_require__("./${TaroTrackLibName}.js");
              _es.logger('图片加载成功', e);
              const originalOnloadMethod = e.currentTarget.dataset.originalOnloadMethod;
              originalOnloadMethod&&this[originalOnloadMethod].call(this, e);
          `;

    const injectSourceImageOnError = `
              const _es = __webpack_require__("./${TaroTrackLibName}.js");
              _es.logger('图片加载失败：',e);
              const tpr = _es.transporter(${JSON.stringify(options.transporterType)}, {
                 baseUrl: ${JSON.stringify(options.env==="production"?ELKLogServerHost:TestELKLogServerHost)},
                 query: {
                   app_name: ${JSON.stringify(options.appName)},
                   app_version: ${JSON.stringify(options.appVersion)},
                   ev_type: 'web_stat'
                 }
              });
              _es.commonBaseField().then(({baseFields, wxSystemInfo})=>{
                const userInfo = _es.getUserInfo(${JSON.stringify(options.cookieKey)});
                const curTarget = e.currentTarget;
                tpr.send({
                  ...baseFields,
                  ev: 'img_error',
                  v: ${JSON.stringify(options.appVersion)},
                  app_name: ${JSON.stringify(options.appName)},
                  app_version: ${JSON.stringify(options.appVersion)},
                  ui: userInfo.unionId,
                  ext: {
                    csspath: curTarget.dataset.taroTrackCssPath,
                    TaroTrackMd5: curTarget.dataset.taroTrackMd5,
                    page_unique_id: userInfo.openId+'${JSON.stringify(Date.now())}', // 页面唯一id
                    open_id: userInfo.openId, // 用户openId
                    url: e.currentTarget.dataset.imageSrc, // 当前页面原始路径
                    error_msg: e.detail.errMsg,
                    time: Date.now(), // 页面停留时长,具体到毫秒时间戳
                    app_id: ${JSON.stringify(options.appId)}, // 小程序id
                    app_name: ${JSON.stringify(options.appNameZH)}, // 小程序名称
                    terminal: wxSystemInfo.osInfo(), // 终端类型 (如：iphone6)s
                    res_type: 1 // 资源类型（1-页面，2-视频）
                  }
                });
              });

              const originalOnerrorMethod = e.currentTarget.dataset.originalOnerrorMethod;
              originalOnerrorMethod&&this[originalOnerrorMethod].call(this, e);
          `;
    const injectSourceInputOnInput = `
              const _es = __webpack_require__("./${TaroTrackLibName}.js");
              _es.logger('文本框输入：',e);
              const tpr = _es.transporter(${JSON.stringify(options.transporterType)}, {
                 baseUrl: ${JSON.stringify(options.env==="production"?ELKLogServerHost:TestELKLogServerHost)},
                 query: {
                   app_name: ${JSON.stringify(options.appName)},
                   app_version: ${JSON.stringify(options.appVersion)},
                   ev_type: 'web_stat'
                 }
              });
              _es.commonBaseField().then(({baseFields, wxSystemInfo})=>{
                const userInfo = _es.getUserInfo(${JSON.stringify(options.cookieKey)});
              const curTarget = e.currentTarget;
              tpr.send({
                ...baseFields,
                ev: 'input_input',
                v: ${JSON.stringify(options.appVersion)},
                app_name: ${JSON.stringify(options.appName)},
                app_version: ${JSON.stringify(options.appVersion)},
                ui: userInfo.unionId,
                ext: {
                  csspath: curTarget.dataset.taroTrackCssPath,
                  TaroTrackMd5: curTarget.dataset.taroTrackMd5,
                  page_unique_id: userInfo.openId+'${JSON.stringify(Date.now())}', // 页面唯一id
                  open_id: userInfo.openId, // 用户openId
                  value: curTarget.value,
                  cursor: curTarget.cursor,
                  url: baseFields.pl, // 当前页面原始路径
                  time: Date.now(), // 页面停留时长,具体到毫秒时间戳
                  app_id: ${JSON.stringify(options.appId)}, // 小程序id
                  app_name: ${JSON.stringify(options.appNameZH)}, // 小程序名称
                  terminal: wxSystemInfo.osInfo(), // 终端类型 (如：iphone6)s
                  res_type: 1 // 资源类型（1-页面，2-视频）
                }
              });
              });

              const originalInputMethod = e.currentTarget.dataset.originalInputMethod;
              originalInputMethod&&this[originalInputMethod].call(this, e);
          `;
    const injectSourceInputOnFocus = `
              const _es = __webpack_require__("./${TaroTrackLibName}.js");
              _es.logger('文本框获得焦点：',e);
              const tpr = _es.transporter(${JSON.stringify(options.transporterType)}, {
                 baseUrl: ${JSON.stringify(options.env==="production"?ELKLogServerHost:TestELKLogServerHost)},
                 query: {
                   app_name: ${JSON.stringify(options.appName)},
                   app_version: ${JSON.stringify(options.appVersion)},
                   ev_type: 'web_stat'
                 }
              });
              _es.commonBaseField().then(({baseFields, wxSystemInfo})=>{
                const userInfo = _es.getUserInfo(${JSON.stringify(options.cookieKey)});
                const curTarget = e.currentTarget;
                tpr.send({
                  ...baseFields,
                  ev: 'input_focus',
                  v: ${JSON.stringify(options.appVersion)},
                  app_name: ${JSON.stringify(options.appName)},
                  app_version: ${JSON.stringify(options.appVersion)},
                  ui: userInfo.unionId,
                  ext: {
                    csspath: curTarget.dataset.taroTrackCssPath,
                    TaroTrackMd5: curTarget.dataset.taroTrackMd5,
                    page_unique_id: userInfo.openId+'${JSON.stringify(Date.now())}', // 页面唯一id
                    open_id: userInfo.openId, // 用户openId
                    value: curTarget.value,
                    cursor: curTarget.cursor,
                    url: baseFields.pl, // 当前页面原始路径
                    time: Date.now(), // 页面停留时长,具体到毫秒时间戳
                    app_id: ${JSON.stringify(options.appId)}, // 小程序id
                    app_name: ${JSON.stringify(options.appNameZH)}, // 小程序名称
                    terminal: wxSystemInfo.osInfo(), // 终端类型 (如：iphone6)s
                    res_type: 1 // 资源类型（1-页面，2-视频）
                  }
                });
              });

              const originalFocusMethod = e.currentTarget.dataset.originalFocusMethod;
              originalFocusMethod&&this[originalFocusMethod].call(this, e);
          `;
    const injectSourceInputOnBlur = `
              const _es = __webpack_require__("./${TaroTrackLibName}.js");
              _es.logger('文本框失去焦点：',e);
              const tpr = _es.transporter(${JSON.stringify(options.transporterType)}, {
                 baseUrl: ${JSON.stringify(options.env==="production"?ELKLogServerHost:TestELKLogServerHost)},
                 query: {
                   app_name: ${JSON.stringify(options.appName)},
                   app_version: ${JSON.stringify(options.appVersion)},
                   ev_type: 'web_stat'
                 }
              });
              _es.commonBaseField().then(({baseFields, wxSystemInfo})=>{
                const userInfo = _es.getUserInfo(${JSON.stringify(options.cookieKey)});
                const curTarget = e.currentTarget;
                tpr.send({
                  ...baseFields,
                  ev: 'input_blur',
                  v: ${JSON.stringify(options.appVersion)},
                  app_name: ${JSON.stringify(options.appName)},
                  app_version: ${JSON.stringify(options.appVersion)},
                  ui: userInfo.unionId,
                  ext: {
                    csspath: curTarget.dataset.taroTrackCssPath,
                    TaroTrackMd5: curTarget.dataset.taroTrackMd5,
                    page_unique_id: userInfo.openId+'${JSON.stringify(Date.now())}', // 页面唯一id
                    open_id: userInfo.openId, // 用户openId
                    value: curTarget.value,
                    cursor: curTarget.cursor,
                    url: baseFields.pl, // 当前页面原始路径
                    time: Date.now(), // 页面停留时长,具体到毫秒时间戳
                    app_id: ${JSON.stringify(options.appId)}, // 小程序id
                    app_name: ${JSON.stringify(options.appNameZH)}, // 小程序名称
                    terminal: wxSystemInfo.osInfo(), // 终端类型 (如：iphone6)s
                    res_type: 1 // 资源类型（1-页面，2-视频）
                  }
                });
              });


              const originalBlurMethod = e.currentTarget.dataset.originalBlurMethod;
              originalBlurMethod&&this[originalBlurMethod].call(this, e);
          `;
    const injectSourceInputOnConfirm = `
              const _es = __webpack_require__("./${TaroTrackLibName}.js");
              _es.logger('文本框输入：',e);
              const tpr = _es.transporter(${JSON.stringify(options.transporterType)}, {
                 baseUrl: ${JSON.stringify(options.env==="production"?ELKLogServerHost:TestELKLogServerHost)},
                 query: {
                   app_name: ${JSON.stringify(options.appName)},
                   app_version: ${JSON.stringify(options.appVersion)},
                   ev_type: 'web_stat'
                 }
              });
              _es.commonBaseField().then(({baseFields, wxSystemInfo})=>{
                const userInfo = _es.getUserInfo(${JSON.stringify(options.cookieKey)});
                const curTarget = e.currentTarget;
                tpr.send({
                  ...baseFields,
                  ev: 'input_confirm',
                  v: ${JSON.stringify(options.appVersion)},
                  app_name: ${JSON.stringify(options.appName)},
                  app_version: ${JSON.stringify(options.appVersion)},
                  ui: userInfo.unionId,
                  ext: {
                    csspath: curTarget.dataset.taroTrackCssPath,
                    TaroTrackMd5: curTarget.dataset.taroTrackMd5,
                    page_unique_id: userInfo.openId+'${JSON.stringify(Date.now())}', // 页面唯一id
                    open_id: userInfo.openId, // 用户openId
                    value: curTarget.value,
                    cursor: curTarget.cursor,
                    url: baseFields.pl, // 当前页面原始路径
                    time: Date.now(), // 页面停留时长,具体到毫秒时间戳
                    app_id: ${JSON.stringify(options.appId)}, // 小程序id
                    app_name: ${JSON.stringify(options.appNameZH)}, // 小程序名称
                    terminal: wxSystemInfo.osInfo(), // 终端类型 (如：iphone6)s
                    res_type: 1 // 资源类型（1-页面，2-视频）
                  }
                });
              });

              const originalConfirmMethod = e.currentTarget.dataset.originalConfirmMethod;
              originalConfirmMethod&&this[originalConfirmMethod].call(this, e);
          `;
    // const injectSourceInputOnKeyboardheightchange = `
    //           const _es = __webpack_require__("./${TaroTrackLibName}.js");
    //           _es.logger('文本框键盘高度改变：',e);
    //           const originalKeyboardheightchangeMethod = e.currentTarget.dataset.originalKeyboardheightchangeMethod;
    //           originalKeyboardheightchangeMethod&&this[originalKeyboardheightchangeMethod].call(this, e);
    //       `;

    const eventList = [
      {
        name: TaroTrackPageEvent['capture-bind:tap'],
        core: TaroTrackEventCollectionCore
      },
      {
        name: TaroTrackPageEvent['bindload'],
        core: injectSourceImageOnload
      },
      {
        name: TaroTrackPageEvent['binderror'],
        core: injectSourceImageOnError
      },
      {
        name: TaroTrackPageEvent['bindinput'],
        core: injectSourceInputOnInput
      },
      {
        name: TaroTrackPageEvent['bindfocus'],
        core: injectSourceInputOnFocus
      },
      {
        name: TaroTrackPageEvent['bindblur'],
        core: injectSourceInputOnBlur
      },
      {
        name: TaroTrackPageEvent['bindconfirm'],
        core: injectSourceInputOnConfirm
      },
      // {
      //   name: TaroTrackPageEvent['bindkeyboardheightchange'],
      //   core: injectSourceInputOnKeyboardheightchange
      // }
    ];

    let injectSourceForDefineEvent = '', injectSourceForRegisterEvent = '';

    // 将所有需要注入到页面js中的方法拼接
    eventList.forEach(event => {

      injectSourceForDefineEvent += `
        {
          key: "${event.name}",
          value: function ${event.name}(e) {
            ${event.core}
          }
       },
      `;

      injectSourceForRegisterEvent += `"${event.name}",`;

    });

    return {
      injectSourceForDefineEvent, injectSourceForRegisterEvent
    };
  }

  /**
   * 在taro编译出来的叶绵绵js中注入taro-track的事件监听函数，
   * 使得用户点击页面是能够触发该函数并进行数据上报
   * @param {string} path     当前需注入的页面组件的路径
   * @param {string} source   当前页面组件的js源码
   * @returns {string}        返回注入后的源码
   */
  injectTaroTrackEventCaptorInPageJs(path: string, source: string): string {

    const {injectSourceForDefineEvent, injectSourceForRegisterEvent} = this.eventFragment();


    // 调用方法进行代码注入
    return this.injectTaroTrackPageEventMethod(path, source, injectSourceForDefineEvent, injectSourceForRegisterEvent, {dolphinActiveElement: ''});

  }

  private injectTaroTrackEventCaptorInNpmJs(path: string, source: string): string{
    const {injectSourceForDefineEvent, injectSourceForRegisterEvent} = this.eventFragment();

    return this.injectTaroTrackNpmComponentEventMethod(path, source, injectSourceForDefineEvent, injectSourceForRegisterEvent,{});
  }

  /**
   * 往app.wxss文件中注入全局样式
   * @param {string} path
   * @param {string} source
   * @returns {string}
   */
  injectTaroTrackClassInAppWxss(path: string, source: string): string{
    return `${source||""}
      .taro-track-active-element{
        animation: TaroTrack-ani infinite linear 2s;
      }

      @keyframes TaroTrack-ani {
        from{
          box-shadow: none;
        }
        50%{
          box-shadow: inset 0 0 100rpx #000000, 0 0 100rpx  #000000;
        }
        to{
          box-shadow: none;
        }
      }
    `;
  }
  /**
   * 往页面的wxss文件中注入样式
   * @param {string} path
   * @param {string} source
   * @returns {string}
   */
  injectTaroTrackClassInPageWxss(path: string, source: string): string{
    return `${source||""}`;
  }
  /**
   * 往组件的wxss文件中注入样式
   * @param {string} path
   * @param {string} source
   * @returns {string}
   */
  injectTaroTrackClassInComponentWxss(path: string, source: string): string{
    return `${source||""}`;
  }

  /**
   * 在app.js中注入引入TaroTrackLib.js的代码
   * @param {string} path
   * @param {string} source
   * @returns {string}
   */
  injectTaroTrackRequireLibJs(path: string, source: string): string {
    return `require("./${TaroTrackLibName}");\n${source}`;
  }

  /**
   * 根据正则表达式匹配文件并并将文件路径、源代码、原始文件对象传入回调
   * @param {RegExp} type
   * @param handler
   * @param notFoundHandler
   */
  getSourceByReg(type: RegExp, handler: (filePath: string, source: string, file: { file: any, path: string })=>void, notFoundHandler?:(type: RegExp)=>void): void{
    const sourceList = this.tfm.getFileListByFileType(type);
    if(sourceList.length===0){
      notFoundHandler&&notFoundHandler(type);
      return;
    }
    sourceList.forEach((jsSource: { file: any, path: string }) => {
      const { path, file } = jsSource;

      const { exclude } = this.TaroTrackPluginInitOptions;

      // 若传入了排除正则，则需将符合条件的路径排除
      if(exclude){
        if(Array.isArray(exclude)){
          for(let i=0,len=exclude.length;i<len;i++){
            let exc = exclude[i];
            if(Object.prototype.toString.call(exc)==="[object RegExp]"){
              // console.log(path.match(exc));
              if(path.match(exc)){
                return;
              }
            }else{
              if(exc===path){
                return;
              }
            }
          }
        }else{
          if(Object.prototype.toString.call(exclude)==="[object RegExp]"){
            if(path.match(exclude)){
              return;
            }
          }else{
            if(exclude===path){
              return;
            }
          }
        }
      }
      // console.log(exclude, path);


      let sourceString = '';
      if(path.indexOf('.js')>=0){
        sourceString = file._cachedSource || file._value;
      }else if(path.indexOf('.wxss')>=0){
        sourceString = file.source();
      }else if(path.indexOf('.wxml')>=0){
        if(path.startsWith("components")){
          sourceString = file.source();
          sourceString = Buffer.from(sourceString).toString('utf-8');
        }else{
          sourceString = Buffer.from(file._value).toString('utf-8');
        }
      }
      handler&&handler(path, sourceString, file);
    });
  }

  /**
   * 对代码进行压缩
   * @param {string} source
   * @returns {string}
   */
  public miniFile(source: string): string{
    return source.replace(miniFileReg, '');
  }

  /**
   * 处理所有的页面js文件，进行代码注入
   */
  buildPageJs(): Promise<void> {

    return new Promise(resolve => {

      this.getSourceByReg(/^pages(.*)\.js$/, async (filePath: string, source: string, file: { file: any, path: string }) => {
        logger.loading(`【PageJs:${filePath}】编译中...`);
        const newSource = this.injectTaroTrackEventCaptorInPageJs(filePath, source);

        const emit = (newSource: string) => {
          // newSource = this.miniFile(newSource);
          const outputPath = `${this.tfm.getOutputPath()}/${filePath}`;
          this.tfm.outputFile(`${outputPath}`, newSource);
          logger.success(`【PageJs:${filePath}】编译完成！`);
          resolve();
        };

        // 执行hooks
        if (this.TaroTrackPluginInitOptions.pageJsHooks) {
          logger.loading(`【PageJs:${filePath}】执行【pageJsHooks】...`);
          try{
            await this.TaroTrackPluginInitOptions.pageJsHooks(filePath, newSource, emit, "pagejs");
          }catch (e) {
            logger.error('执行[pageJsHooks]错误', e);
          }

        } else {
          emit(newSource);
        }
      },()=>resolve());
    });
  }

  /**
   * todo 往组件js中注入监听函数实现at-input输入监听
   * @returns {Promise<void>}
   */
  buildNpmComponentJs(): Promise<void>{
    return new Promise(resolve => {

      this.getSourceByReg(/^npm\/taro-ui\/dist\/weapp\/components(.*)\.js$/, async (filePath: string, source: string, file: { file: any, path: string }) => {
        logger.loading(`【ComponentJs:${filePath}】编译中...`);
        const newSource = this.injectTaroTrackEventCaptorInNpmJs(filePath, source);

        const emit = (newSource: string) => {
          // newSource = this.miniFile(newSource);
          const outputPath = `${this.tfm.getOutputPath()}/${filePath}`;
          this.tfm.outputFile(`${outputPath}`, newSource);
          logger.success(`【ComponentJs:${filePath}】编译完成！`);
          resolve();
        };

        // 执行hooks
        if (this.TaroTrackPluginInitOptions.npmComponentJsHooks) {
          logger.loading(`【ComponentJs:${filePath}】执行【componentJsHooks】...`);
          try{
            await this.TaroTrackPluginInitOptions.npmComponentJsHooks(filePath, newSource, emit, "commonjs");
          }catch (e) {
            logger.error('执行[componentJsHooks]错误', e);
          }

        } else {
          emit(newSource);
        }
      }, ()=>resolve());
    });
  }

  /**
   * 构建TaroTrackLib.js,并在taro的输出目录生成对应文件
   * @returns {Promise<void>}
   */
  buildTaroTrackLibJs(): Promise<void> {

    return new Promise<void>(async resolve => {
      logger.loading(`【TaroTrackLib:${TaroTrackLibName}.js】编译中...`);
      const newSource = this.injectTaroTrackLibJs();

      const emit = (newSource: string) => {
        // newSource = this.miniFile(newSource);
        const outputPath = `${this.tfm.getOutputPath()}/${TaroTrackLibName}.js`;
        this.tfm.outputFile(`${outputPath}`, newSource);
        logger.success(`【TaroTrackLib:${TaroTrackLibName}.js】编译完成！`);
        resolve();
      };


      // 执行hooks
      if (this.TaroTrackPluginInitOptions.dolphinLibJsHooks) {
        logger.loading(`【TaroTrackLib:${TaroTrackLibName}】执行【commonJsHooks】...`);
        try{
          await this.TaroTrackPluginInitOptions.dolphinLibJsHooks(`${TaroTrackLibName}.js`, newSource, emit, "TaroTrackLib");
        }catch (e) {
          logger.error('执行[commonJsHooks]错误', e);
        }

      } else {
        emit(newSource);
      }

    });
  }

  /**
   * 编译app.js文件，并注入必要的代码
   * @returns {Promise<void>}
   */
  buildAppJs(): Promise<void> {
    return new Promise(resolve => {

      this.getSourceByReg(/^app\.js$/, async (filePath: string, source: string, file: { file: any, path: string }) => {
        logger.loading(`【AppJs:${filePath}】编译中...`);
        const newSource = this.injectTaroTrackRequireLibJs(filePath, source);
        const emit = (newSource: string) => {
          // newSource = this.miniFile(newSource);
          const outputPath = `${this.tfm.getOutputPath()}/${filePath}`;
          this.tfm.outputFile(`${outputPath}`, newSource);
          logger.success(`【AppJs:${filePath}】编译完成！`);
          resolve();
        };

        // 执行hooks
        if (this.TaroTrackPluginInitOptions.appJsHooks) {
          logger.loading(`【AppJs:${filePath}】执行【appJsHooks】...`);
          try{
            await this.TaroTrackPluginInitOptions.appJsHooks(filePath, newSource, emit, "appjs");
          }catch (e) {
            logger.error('执行[appJsHooks]错误', e);
          }

        } else {
          emit(newSource);
        }

      },()=>resolve());

    });

  }

  /**
   * 往页面wxss和app.wxss中注入样式代码
   * @returns {Promise<void>}
   */
  buildWXSS(): Promise<void>{
    return new Promise<void>(resolve => {

      this.getSourceByReg(/\.wxss$/, async (filePath: string, source: string, file: { file: any, path: string }) => {
        logger.loading(`【Wxss:${filePath}】编译中...`);
        let newSource = '';
        if(filePath.startsWith("pages")){// 页面样式
          newSource = this.injectTaroTrackClassInPageWxss(filePath, source);
        }else if(filePath.indexOf('app.wxss')>=0){
          newSource = this.injectTaroTrackClassInAppWxss(filePath, source);
        }else{
          newSource = this.injectTaroTrackClassInComponentWxss(filePath, source);
        }

        const emit = (newSource: string) => {
          // 压缩代码
          newSource = this.miniFile(newSource);
          const outputPath = `${this.tfm.getOutputPath()}/${filePath}`;
          this.tfm.outputFile(`${outputPath}`, newSource);
          logger.success(`【Wxss:${filePath}】编译完成！`);
          resolve();
        };

        // 执行hooks
        if (this.TaroTrackPluginInitOptions.wxssHooks) {
          logger.loading(`【Wxss:${filePath}】执行【wxssHooks】...`);
          try{
            await this.TaroTrackPluginInitOptions.wxssHooks(filePath, newSource, emit, filePath.startsWith('pages')?"pageWxss":"componentWxss");
          }catch (e) {
            logger.error('执行[wxssHooks]错误', e);
          }

        } else {
          emit(newSource);
        }

      },()=>resolve());
    });
  }


  /**
   * 处理所有页面和组件的wxml,并进行代码注入
   */
  buildWXML(): Promise<any> {

    return new Promise((resolve, reject) => {

      this.getSourceByReg(/\.wxml$/, async (filePath: string, source: string, file: { file: any, path: string }) => {
        logger.loading(`【WXML:${filePath}】编译中...`);
        // 将源代码字符串转换为json对象

        let xml = wxml2json(source);
        let sourceString = JSON.stringify(xml);

        // 寻找当前wxml的真实根节点
        // let roots: any[] = [];
        // WXMLHelper.findWXMLRealRoot(xml, roots);
        // const root = roots[0];
        let root = xml;

        try {

          // console.log(source);
          // 在页面根节点注入全局事件监听方法
          WXMLHelper.findWXMLRealRoot(xml, async realRoot=>{
            const realRootString = JSON.stringify(realRoot);
            // console.log('真正的根节点', realRoot);
            realRoot = this.injectTaroTrackEventCaptorInPageRoot(realRoot);

            // 为所有的元素节点注入class:taro-track-element，方便定位点击的是哪一个元素
            realRoot = await this.injectTaroTrackElementClassNameInWXML(realRoot);

            xml = sourceString.replace(realRootString, JSON.stringify(realRoot));

            xml = json2wxml(JSON.parse(xml));
            xml = wxml2json(xml);

            // 为图片注入onload方法监听图片的加载
            xml = await this.injectTaroTrackImageOnLoadInWXML(xml);
            // 为页面所有的input的方法添加监听
            xml = await this.injectTaroTrackInputEventInWXML(xml);

            // console.log('====>', JSON.stringify(xml, null, 4));

            // console.log(xml);

            // console.log(JSON.stringify(realRoot, null, 4),JSON.stringify(xml, null, 4));

            const emit = (newSource: string) => {
              // 注入已完成，将json重新转换为wxml
              let newXml = json2wxml(newSource);

              newXml = this.miniFile(newXml);

              // 输出文件内容
              const outputPath = `${this.tfm.getOutputPath()}/${filePath}`;
              this.tfm.outputFile(`${outputPath}`, newXml);
              logger.success(`【WXML:${filePath}】编译完成！`);
              resolve();
            };

            // 执行hooks
            if (this.TaroTrackPluginInitOptions.wxmlLHooks) {
              logger.loading(`【WXML:${filePath}】执行【wxmlLHooks】...`);
              try{
                await this.TaroTrackPluginInitOptions.wxmlLHooks(filePath, xml, emit, filePath.startsWith('pages')?"pageWxml":"componentWxml");
              }catch (e) {
                logger.error('执行[wxmlLHooks]错误', e);
                emit(xml);
              }

            } else {
              emit(xml);
            }

          });
        } catch (e) {
          console.error('wxml文件解析失败', e);
          reject(e);
        }
      },()=>resolve());

    });

  }

  /**
   * 初始化Taro文件管理器
   * @param stats
   */
  initTfm(stats: any) {
    if (!this.tfm) {
      this.tfm = new TaroFileManager(stats);
    } else {
      this.tfm.updateCtx(stats);
    }
  }

  /**
   * 进行所有文件的处理工作
   */
  async build() {
    await this.buildWXML();
    await this.buildAppJs();
    await this.buildTaroTrackLibJs();
    await this.buildPageJs();
    await this.buildNpmComponentJs();
    await this.buildWXSS();
  }

  /**
   * 初始化
   * @param stats
   */
  async initInjector(stats: any) {
    this.initTfm(stats);
    await this.build();
  }

}

export const findRealRootInWXML = WXMLHelper.findWXMLRealRoot;
export const findElementAllInWXML = WXMLHelper.findElementAll;
export const findElementInWXML = WXMLHelper.findElement;
