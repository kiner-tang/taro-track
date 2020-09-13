const path = require('path');
// 1、插件开发调试阶段可以直接运行开发命令，将插件输出到当前项目目录进行调试，插件部分更改可实时更新，只需重启当前项目的taro服务即可
// 开发阶段直接引入
const { TaroTrackPlugins } = require("../plugins/plugins");

// const {
//   TaroTrackPlugins
// } = require('@kiner/taro-track-main/plugins/plugins');

const { NODE_ENV:env } = process.env;

const isProd = env==="production";



const config = {
  projectName: "taro-track-demo",
  date: "2020-9-12",
  designWidth: 750,
  deviceRatio: {
    "640": 2.34 / 2,
    "750": 1,
    "828": 1.81 / 2
  },
  sourceRoot: "src",
  outputRoot: "dist",
  babel: {
    sourceMap: true,
    presets: [
      [
        "env",
        {
          modules: false
        }
      ]
    ],
    plugins: [
      "transform-decorators-legacy",
      "transform-class-properties",
      "transform-object-rest-spread",
      [
        "transform-runtime",
        {
          helpers: false,
          polyfill: false,
          regenerator: true,
          moduleName: "babel-runtime"
        }
      ]
    ]
  },
  defineConstants: {},
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        config: {
          limit: 10240 // 设定转换尺寸上限
        }
      },
      cssModules: {
        enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        config: {
          namingPattern: "module", // 转换模式，取值为 global/module
          generateScopedName: "[name]__[local]___[hash:base64:5]"
        }
      }
    }
  },
  h5: {
    publicPath: "/",
    staticDirectory: "static",
    postcss: {
      autoprefixer: {
        enable: true,
        config: {
          browsers: ["last 3 versions", "Android >= 4.1", "ios >= 8"]
        }
      },
      cssModules: {
        enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        config: {
          namingPattern: "module", // 转换模式，取值为 global/module
          generateScopedName: "[name]__[local]___[hash:base64:5]"
        }
      }
    }
  }
};

module.exports = function(merge) {
  let realConfig = merge({}, config, require("./prod"));
  if (process.env.NODE_ENV === "development") {
    realConfig = merge({}, config, require("./dev"));
  }

  const dwp = new TaroTrackPlugins.TaroTrackPlugin({
    transporterOptions: {
      env,
      transporterType: isProd?"Elk":"Console",
      appName: realConfig.env.appName,
      appVersion: realConfig.env.appVersion,
      appNameZH: realConfig.env.appNameZH,
      unionId: realConfig.env.unionId,
      cookieKey: realConfig.env.cookieKey
    },
    pageWXMLHooks(path, source, emit, type) {
      // TODO 在这里可以对wxml文件的源代码进行修改,修改完后执行emit方法并传入新的源代码
      console.log(`\x1B[1m[DolphinWx]\x1B[0m 【Plugin:pageWXMLHooks】 ${path}`);

      // wxml已经被解析成json,可用通过更改json的属性实现更改wxml的目的
      // 如在index/index.wxml的第一个实际根节点（非block）上增加一个class
      if (path === "pages/index/index.wxml") {
        dolphinWxPlugins.findRealRootInWXML(source, realRoot => {
          realRoot.attr.class += " customInjectTestClass";
        });
      }

      // 页面插入环境判断标签
      if (process.env.NODE_ENV !== "production" && type === "pageWxml") {
        source.children.push({
          type: "element",
          tag: "view",
          attr: {
            class: "dolphin-wx-env-tag"
          },
          children: [
            {
              type: "text",
              text: "测试环境",
              attr: {}
            }
          ]
        });
      }

      emit(source);
    },
    pageJsHooks(path, source, emit) {
      // TODO 在这里可以对页面js的源代码进行修改,修改完后执行emit方法并传入新的源代码

      console.log(`\x1B[1m[DolphinWx]\x1B[0m 【Plugin:pageJsHooks】 ${path}`);
      emit(source);
    },
    appJsHooks(path, source, emit) {
      // TODO 在这里可以对appJs的源代码进行修改,修改完后执行emit方法并传入新的源代码

      console.log(`\x1B[1m[DolphinWx]\x1B[0m 【Plugin:appJsHooks】 ${path}`);
      emit(source);
    },
    dolphinLibJsHooks(path, source, emit) {
      // TODO 在这里可以对dolphinLib，即sdk对小程序注入的库文件的源代码进行修改,修改完后执行emit方法并传入新的源代码

      console.log(
        `\x1B[1m[DolphinWx]\x1B[0m 【Plugin:dolphinLibJsHooks】 ${path}`
      );
      emit(source);
    },
    wxssHooks(path, source, emit, type) {
      // TODO 在这里可以对app.wxss文件进行修改,修改完后执行emit方法并传入新的源代码

      console.log(`\x1B[1m[DolphinWx]\x1B[0m 【Plugin:appWxssHooks】 ${path}`);

      // 为页面插入的环境判断标签设置样式
      if (process.env.NODE_ENV !== "production" && type === "pageWxss") {
        source += `
            .dolphin-wx-env-tag{
              position: fixed;
              bottom: 0;
              left: 0;
              width: 100vw;
              padding: 15rpx 0;
              text-align: center;
              background: #990000;
              opacity: .6;
              pointer-events: none;
              color: #FFFFFF;
              text-shadow: 0 0 10rpx #000000;
            }
          `;
      }

      emit(source);
    }
  });



  realConfig.plugins = (realConfig.plugins||[]).concat([dwp]);

  // console.log(realConfig);

  return realConfig;
};
