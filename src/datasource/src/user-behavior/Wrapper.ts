let globalVarApp : WechatMiniprogram.App.Constructor; // 小程序原App对象
let globalVarPage : WechatMiniprogram.Page.Constructor; // 小程序原Page对象
let globalVarComponent : WechatMiniprogram.Component.Constructor; // 小程序原Component对象

export class Wrapper {
  private injectPageMethods: any[] = [];
  private injectAppMethods: any[] = [];
  private extraPageMethods: any[] = [];
  private extraAppMethods: any[] = [];
  private injectComponentMethods: any[] = [];
  private extraComponentMethods: any[] = [];
  protected __App: WechatMiniprogram.App.Constructor;
  protected __Page: WechatMiniprogram.Page.Constructor;
  protected __Comp: WechatMiniprogram.Component.Constructor;
  constructor(isUsingPlugin: boolean) {
    globalVarApp = this.__App = App;
    globalVarPage = this.__Page = Page;
    globalVarComponent = this.__Comp = Component;


    if (!isUsingPlugin) {
      App = (app) => globalVarApp(this._create(app, this.injectAppMethods, this.extraAppMethods));
      Page = (page) => {
        let _page = globalVarPage(this._create(page, this.injectPageMethods, this.extraPageMethods));
        return _page;
      };
      Component = (component) => globalVarComponent(this._createComponent(component, this.injectComponentMethods, this.extraComponentMethods));
    }
  }

  /**
   * 对用户定义函数进行包装.
   * @param {Object} target page对象或者app对象
   * @param {Object} component
   * @param {String} methodName 需要包装的函数名
   * @param {Array} methods 函数执行前执行任务
   */
  _wrapTargetMethod(target: any, component: any, methodName:string, methods: any[] = []) {
    const methodFunction = target[methodName];
    target[methodName] = function _aa(...args: any[]) {
      const result = methodFunction && methodFunction.apply(this, args);
      const methodExcuter = () => {
        methods.forEach((fn) => {
          fn.apply(this, [target, component, methodName, ...args]);
        });
      };
      try {
        if (Object.prototype.toString.call(result) === '[object Promise]') {
          result.then(() => {
            methodExcuter();
          }).catch(() => {
            methodExcuter();
          });
        } else {
          methodExcuter();
        }
      } catch (e) {
        console.error(methodName, '钩子函数执行出现错误', e);
      }
      return result;
    };
  }

  /**
   * 追加函数到Page/App对象
   * @param {Object} target page对象或者app对象
   * @param {Array} methods 需要追加的函数数组
   */
  _addExtraMethod(target: any, methods: any[]) {
    methods
      .forEach(fn => {
        const methodName = fn.name;
        target[methodName] = fn;
      });
  }

  /**
   * @param {*} target page对象或者app对象
   * @param injectMethods
   * @param extraMethods
   */
  _create(target: any, injectMethods: any[], extraMethods: any[]) {
    Object.keys(target)
      .filter((prop) => typeof target[prop] === 'function')
      .forEach((methodName) => {
        this._wrapTargetMethod(target, null, methodName, injectMethods);
      });
    this._addExtraMethod(target, extraMethods);
    return target;
  }

  _createComponent(component: any, injectMethods: any[], extraMethods: any[]) {
    const target = component.methods;
    Object.keys(target)
      .filter((prop) => typeof target[prop] === 'function')
      .forEach((methodName) => {
        this._wrapTargetMethod(target, component, methodName, injectMethods);
      });
    this._addExtraMethod(target, extraMethods);
    return component;
  }

  addPageMethodWrapper(fn: (...args: any[])=>void) {
    this.injectPageMethods.push(fn);
  }

  addComponentMethodWrapper(fn: (...args: any[])=>void) {
    this.injectComponentMethods.push(fn);
  }

  addAppMethodWrapper(fn: (...args: any[])=>void) {
    this.injectAppMethods.push(fn);
  }

  addPageMethodExtra(fn: (...args: any[])=>void) {
    this.extraPageMethods.push(fn);
  }

  addAppMethodExtra(fn: (...args: any[])=>void) {
    this.extraAppMethods.push(fn);
  }

  createApp(app: any) {
    globalVarApp(this._create(app, this.injectAppMethods, this.extraAppMethods));
  }

  createPage(page: any) {
    globalVarPage(this._create(page, this.injectPageMethods, this.extraPageMethods));
  }

  createComponent(component: any) {
    globalVarPage(this._createComponent(component, this.injectPageMethods, this.extraPageMethods));
  }
}

