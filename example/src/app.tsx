import Taro, { Component, Config } from '@tarojs/taro';

import { initAppletLifecycleListener, initDolphin } from '@kiner/track/entry';

import Index from './pages/index';

import './app.scss';
import { appId, appName, appVersion, dolphinBaseConfig, openId, unionId } from './config';

// 通过代理微信原生小程序的Component实现对页面组件生命周期的监听
function initLifecycleListener() {
  initAppletLifecycleListener(dolphinBaseConfig, {
    open_id: openId,
    page_unique_id: `${openId}${Date.now()}`,
    ui: unionId,
    app_id: appId,
    app_name: appName,
    v: appVersion
  });
}

initLifecycleListener();


class App extends Component {
  componentDidMount() {
    // TaroTrack.initDolphin(dolphinBaseConfig);
    initDolphin(dolphinBaseConfig);
  }

  componentDidShow() {}

  componentDidHide() {}

  componentDidCatchError() {}

  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    pages: ["pages/index/index", "pages/detail/detail"],
    window: {
      backgroundTextStyle: "light",
      navigationBarBackgroundColor: "#fff",
      navigationBarTitleText: "WeChat",
      navigationBarTextStyle: "black"
    }
  };

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render() {
    return <Index />;
  }
}

Taro.render(<App />, document.getElementById("app"));
