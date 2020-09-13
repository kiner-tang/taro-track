
## 安装依赖包

```shell script
yarn add @kiner/common @kiner/core @kiner/database @kiner/datasource @kiner/entry @kiner/strategy @kiner/core @kiner/transporter @kiner/es @kiner/plugins -S
```

## 编译命令

```js

const packageJson = {
    "gulp:build": "gulp build",// 构建所有模块
    "publish:all": "bash ./tools/npm/publish.sh",// 发布所有模块
    //---------以下为单独构建和发布某一模块的命令-------------
    "build:common": "gulp common",
    "publish:common": "cd dist/common;npm publish;",

    "build:core": "gulp core",
    "publish:core": "cd dist/core;npm publish;",

    "build:datasource": "gulp datasource",
    "publish:datasource": "cd dist/datasource;npm publish;",

    "build:database": "gulp database",
    "publish:database": "cd dist/database;npm publish;",

    "build:strategy": "gulp strategy",
    "publish:strategy": "cd dist/strategy;npm publish;",

    "build:transporter": "gulp transporter",
    "publish:transporter": "cd dist/transporter;npm publish;",

    "build:entry": "rm -rf ./dist/entry;gulp entry",
    "publish:entry": "cd dist/entry;npm publish;",

    // 采用webpack将所有模块打包成一个dolphin-wx.min.js(支持ES6模块引入方式)
    "dev:es": "cross-env NODE_ENV=development webpack --config ./build/webpack.config.es6.js --watch",
    "build:es": "rm -rf ./dist/es;webpack --config ./build/webpack.config.es6.js",
    "publish:es": "cd dist/es;npm publish;",
    // 调试、构建、发布基于taro的webpack插件
    "dev:plugins": "rm -rf ./dist/plugins;webpack --config ./build/webpack.config.common.js --watch",
    "build:plugins": "rm -rf ./dist/plugins;webpack --config ./build/webpack.config.common.js",
    "publish:plugins": "cd dist/plugins;npm publish;"
  }


```

## 微信开发者工具控制台工具的使用

在已经使用TaroTrackPlugin的项目的微信开发者工具控制台中输入一下命令查看工具使用方式

```javascript
wx.TaroTrack.help()
```
