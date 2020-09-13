
export const WXMLTaroTrackAttr = {
  TaroTrackInfo: 'data-taro-track-data-info',
  parentDeepIndex: 'taro-track-parent-deep-index',
  deepIndex: 'taro-track-deep-index',
  tag: 'data-taro-track-tag',
  id: 'data-taro-track-id',
  parentCssPath: 'taro-track-parent-css-path',
  childDeepIndex: 'taro-track-child-deep-index',
  cssPath: 'data-taro-track-css-path',
  text: 'data-taro-track-text',
  md5: 'data-taro-track-md5',
};

/**
 * @date 2020-09-12
 * @author kinertang
 * @description 用户辅助操作WXML的工具类
 */
export class WXMLHelper {
  private root: any;

  constructor(xml: any) {
    this.root = xml;
  }

  /**
   * 查找wxml的真实根节点（非block）
   * @param xml
   * @param  handler
   */
  public static findWXMLRealRoot(xml: any, handler: (root: any)=>void): void {

    if (xml.type === 'element' && ['cover-view', 'movable-view', 'movable-area', 'scroll-view', 'swiper', 'swiper-item', 'view'].indexOf(xml.tag) >= 0) {
      // console.log(`发现根元素元素：`, xml);
      handler(xml);
      return;
    } else if (Array.isArray(xml)) {
      xml.forEach(child => WXMLHelper.findWXMLRealRoot(child, handler));
    } else {
      const children = xml.children;
      if (children) {
        WXMLHelper.findWXMLRealRoot(children, handler);
      } else {
        WXMLHelper.findWXMLRealRoot(xml, handler);
      }
    }
  }

  /**
   * 递归查找所有的真实元素节点（block节点除外）
   * 每当找到一个真实元素节点便会触发cb回调，并将当前元素的tag和当前元素作为参数传回
   * 若cb的返回值为false时终止继续递归查询
   * @param root
   * @param {(elementName: string, element: any) => (boolean | void)} cb
   * @param mask 是否在元素上添加一些标记用以数据上报
   */
  public static findWXMLElement(root: any, cb: (elementName: string, element: any) => boolean | void, mask: boolean = false) {
    let TaroTrackInfo:any;
    if (root.type === 'root'||root.type === 'element') {
      // console.log('是否标记：', mask);
      // 当mask为true时，默认会对所有的标签打标记，这样就可以在查找的同时进行标记，节省了重复标记的时间
      if (mask) {
        if (!root.attr) {
          root.attr = {};
        }
        if(root.attr[WXMLTaroTrackAttr.TaroTrackInfo]){
          try{
            TaroTrackInfo = JSON.parse(decodeURIComponent(root.attr[WXMLTaroTrackAttr.TaroTrackInfo]));
          }catch (e) {
            TaroTrackInfo = {};
          }

        }else{
          TaroTrackInfo = {};
        }
        if (TaroTrackInfo[WXMLTaroTrackAttr.deepIndex] === undefined) {
          TaroTrackInfo[WXMLTaroTrackAttr.deepIndex] = 0;
        } else {
          TaroTrackInfo[WXMLTaroTrackAttr.deepIndex] = TaroTrackInfo[WXMLTaroTrackAttr.parentDeepIndex] + 1;
        }
        const csspath = `${root.tag}_${TaroTrackInfo[WXMLTaroTrackAttr.deepIndex]}${TaroTrackInfo[WXMLTaroTrackAttr.childDeepIndex] ? `_${TaroTrackInfo[WXMLTaroTrackAttr.childDeepIndex]}` : '_0'}`;

        let wxForIndex = root.attr["wx:for-index"];
        let classPath = (root.attr.class || '');
        let dynamicClassReg = /\{\{([^\}]*)\}\}/g;
        classPath = classPath.replace(dynamicClassReg,'');

        classPath.split(' ').filter((item: string)=>!!item).join('.');
        // classPath = '';
        let idPath = (root.attr.id || '');
        let parentCssPath = `${TaroTrackInfo[WXMLTaroTrackAttr.parentCssPath] ? `${TaroTrackInfo[WXMLTaroTrackAttr.parentCssPath]}>` : 'page>'}`;
        classPath = classPath ? `.${classPath}` : '';
        idPath = idPath?`#${idPath}`:'';

        const realCssPath = `${parentCssPath}${csspath}${idPath}${classPath}`;

        // console.log(root);
        root.attr[WXMLTaroTrackAttr.tag] = TaroTrackInfo[WXMLTaroTrackAttr.tag] = root.tag;
        // console.log(root.type, root);

        if(root.children&&Array.isArray(root.children)){
          const texts = root.children.filter((item:any)=>{
            // console.log(item.text, dynamicClassReg.test(item.text));
            return item.type==="text"
          });
          root.attr[WXMLTaroTrackAttr.text] = TaroTrackInfo[WXMLTaroTrackAttr.text] = texts.map((item: any)=>{
            // if(dynamicClassReg.test(item.text)&&!wxForIndex){
            //   return encodeURIComponent(item.text);
            // }else{
              return item.text.replace(/\r\n/g,"\\n").replace(/\n/g,"");
            // }

          }).join(' ').trim().replace('"',"'");
        }


        root.attr[WXMLTaroTrackAttr.id] = TaroTrackInfo[WXMLTaroTrackAttr.id] = root.attr.id || '';
        // 由于插件是在node环境下运行的，因此，需要使用nodejs内置的库需要使用require
        const crypto = require('crypto');
        const md5 = crypto.createHash('md5');
        md5.update(realCssPath);
        let md5Str = md5.digest('hex');
        md5Str = `md5-${md5Str}`;
        let md5StrNotDynamicArg = `'${md5Str}'`;
        if(wxForIndex){
          md5StrNotDynamicArg = `'${md5Str}_'+${wxForIndex}`;
          md5Str+=`_{{${wxForIndex}}}`;
        }

        // console.log(realCssPath, md5Str);

        root.attr[WXMLTaroTrackAttr.md5] = TaroTrackInfo[WXMLTaroTrackAttr.md5] = md5Str;
        if(!root.attr.class){
          root.attr.class = '';
        }
        // 加上带有md5的class后，我们便可以通过在调试工具中运行以下代码获取元素的信息
        // var query = wx.createSelectorQuery();
        // var nodes = query.selectAll('.md5-b0df029f')
        // nodes.boundingClientRect();
        // nodes.fields({
        //       dataset: true,
        //       size: true,
        //       scrollOffset: true,
        //       properties: ['scrollX', 'scrollY'],
        //       computedStyle: ['margin', 'backgroundColor'],
        //       context: true,
        //     });
        // query.exec(function([rect, fields]){console.log({fields: fields[0], rect: rect[0]})});
        // wx.pageScrollTo({selector: '.md5-b0df029f'});
        // 或
        // wx.TaroTrack.showViewBySelector(".md5-71dfd94e5b6be8040bacb4098be239e4");
        root.attr.class += ` ${md5Str} {{dolphinActiveElement===${md5StrNotDynamicArg}?' taro-track-active-element':''}}`;
        root.attr[WXMLTaroTrackAttr.cssPath] = TaroTrackInfo[WXMLTaroTrackAttr.cssPath] = realCssPath;
        root.attr[WXMLTaroTrackAttr.TaroTrackInfo] = encodeURIComponent(JSON.stringify(TaroTrackInfo));
      }

      const isContinue = cb && cb(root.tag, root);
      if (root.children && isContinue !== false) {
        root.children.forEach((child: any, index: number) => {
          if(mask){
            if (!child.attr) {
              child.attr = {};
            }

            let childTaroTrackInfo: any;
            if(child.attr[WXMLTaroTrackAttr.TaroTrackInfo]){
              childTaroTrackInfo = decodeURIComponent(root.attr[WXMLTaroTrackAttr.TaroTrackInfo]);
            }else{
              childTaroTrackInfo = {};
            }
            childTaroTrackInfo[WXMLTaroTrackAttr.parentCssPath] = TaroTrackInfo[WXMLTaroTrackAttr.cssPath];
            childTaroTrackInfo[WXMLTaroTrackAttr.parentDeepIndex] = TaroTrackInfo[WXMLTaroTrackAttr.deepIndex];
            childTaroTrackInfo[WXMLTaroTrackAttr.childDeepIndex] = index;
            child.attr[WXMLTaroTrackAttr.TaroTrackInfo] = encodeURIComponent(JSON.stringify(childTaroTrackInfo));

          }

          WXMLHelper.findWXMLElement(child, cb, mask);
        });
      }
    }
  }

  /**
   * 根据id|class|tag查找元素
   * @param root
   * @param {string} selector
   * @returns {Promise<any>}
   */
  public static findElement(root: any, selector: string): Promise<any>{
    return new Promise<any>(resolve => {
      if(selector.startsWith('#')){// id
        WXMLHelper.findWXMLElement(root, ((elementName, element) => {
          if(element.attr.id===selector.substring(1)){
            resolve(element);
            return false;
          }
        }),false);
      }else if(selector.startsWith('.')){// class
        WXMLHelper.findWXMLElement(root, ((elementName, element) => {
          if(element.attr.class.split(' ').includes(selector.substring(1))){
            resolve(element);
            return false;
          }
        }),false);
      }else{// tagName
        WXMLHelper.findWXMLElement(root, ((elementName, element) => {
          if(selector===elementName){
            resolve(element);
            return false;
          }
        }),false);
      }
    });
  }
  /**
   * 根据id|class|tag查找元素
   * @param root
   * @param {string} selector
   * @returns {Promise<any>}
   */
  public static findElementAll(root: any, selector: string): Promise<any[]>{
    let res: any[] = [];
    return new Promise<any[]>(resolve => {
      // console.log('查询元素', root, selector);
      if(selector.startsWith('#')){// id
        WXMLHelper.findWXMLElement(root, ((elementName, element) => {
          if(element.attr.id===selector.substring(1)){
            res.push(element);
          }
        }),false);
      }else if(selector.startsWith('.')){// class
        WXMLHelper.findWXMLElement(root, ((elementName, element) => {
          if(element.attr.class.split(' ').includes(selector.substring(1))){
            res.push(element);
          }
        }),false);
      }else{// tagName
        WXMLHelper.findWXMLElement(root, ((elementName, element) => {
          // console.log(elementName, element);
          if(selector===elementName){
            res.push(element);
          }
        }),false);
      }
      resolve(res);
    });

  }
  /**
   * 查找并更新目标元素的属性
   * @param root
   * @param {string} selector
   * @param attr
   * @returns {Promise<any>}
   */
  public static updateElementAttrAll(root: any, selector: string, attr: any): void{
    if(selector.startsWith('#')){// id
      WXMLHelper.findWXMLElement(root, ((elementName, element) => {
        if(element.attr.id===selector.substring(1)){
          element.attr = attr;
        }
      }),false);
    }else if(selector.startsWith('.')){// class
      WXMLHelper.findWXMLElement(root, ((elementName, element) => {
        if(element.attr.class.split(' ').includes(selector.substring(1))){
          element.attr = attr;
        }
      }),false);
    }else{// tagName
      WXMLHelper.findWXMLElement(root, ((elementName, element) => {
        if(selector===elementName){
          element.attr = attr;
        }
      }),false);
    }

  }

}

/**
 * 再重新将文件输出到wxml之前，先将一些不必要的属性去掉
 * @param root
 * @param tmp
 */
export function filterWXMLTaroTrackAttr(root: any){
  if(root.attr&&root.attr[WXMLTaroTrackAttr.TaroTrackInfo]){
    // console.log('准备删除：',key,root.attr[key]);
    delete root.attr[WXMLTaroTrackAttr.TaroTrackInfo];
  }
  if(root.children){
    root.children.forEach((child: any) => {
      filterWXMLTaroTrackAttr(child);
    });
  }
  return root;
}
