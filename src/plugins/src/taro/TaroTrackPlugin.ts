/**
 * 在taro运行时对输出的wxml、js等资源进行一定的修饰以达到全自动监听的目的
 */
import { TaroTrackSourceInjector } from '@/src/plugins/src/taro/TaroTrackSourceInjector';
import { taroTargetVersion } from '@/src/plugins/src/taro/config';
import { Logger4Node } from '@kiner/taro-track-corejs';
import { TaroTrackLoggerNamespace } from '@kiner/taro-track-common';
import { TransporterType } from '@kiner/taro-track-entrypoint';

const { exec } = require('shelljs');

export interface TaroTrackPluginInitOptions {
  transporterOptions: {
    env: string,
    transporterType: TransporterType,
    cookieKey?: string,
    appName: string,
    appVersion: string,
    appId?: string,
    appNameZH?: string
  },
  exclude?: RegExp[]|RegExp|string[]|string
  wxmlLHooks?: (path: String, source: string, emit: (newSource: string)=>void, type: string)=>Promise<any>
  pageJsHooks?: (path: String, source: string, emit: (newSource: string)=>void, type: string)=>Promise<any>
  componentJsHooks?: (path: String, source: string, emit: (newSource: string)=>void, type: string)=>Promise<any>
  npmComponentJsHooks?: (path: String, source: string, emit: (newSource: string)=>void, type: string)=>Promise<any>
  appJsHooks?: (path: String, source: string, emit: (newSource: string)=>void, type: string)=>Promise<any>
  wxssHooks?: (path: String, source: string, emit: (newSource: string)=>void, type: string)=>Promise<any>
  dolphinLibJsHooks?: (path: String, source: string, emit: (newSource: string)=>void, type: string)=>Promise<any>
  postDataHooks?: (data: any)=>Promise<any>
}


const logger: Logger4Node = new Logger4Node(TaroTrackLoggerNamespace, {
  groupCollapsed: false
});
/**
 * 基于Taro的Dolphin插件，通过此入口可以在taro编译结束后对输出的源代码进行二次编译，
 * 从而实现数据自动埋点、监听、上报等功能
 *
 * 使用方式：
 *
 * 在taro项目根目录下的`config/index.js`中引入当前插件，并如下使用：
 *
 * const config = {
 *   // 省略无关配置...
 *   plugins: [
 *     new TaroTrackPlugins.TaroTrackPlugin({
 *        pageWXMLHooks(path, source, emit) {
 *          // TODO 在这里可以对wxml文件的源代码进行修改,修改完后执行emit方法并传入新的源代码
 *          console.log(
 *            `\x1B[1m[TaroTrack]\x1B[0m 【Plugin:pageWXMLHooks】 ${path}`
 *          );
 *
 *          // wxml已经被解析成json,可用通过更改json的属性实现更改wxml的目的
 *          // 如在index/index.wxml的第一个实际根节点（非block）上增加一个class
 *          if (path === "pages/index/index.wxml") {
 *            source.attr.class += " testClass";
 *          }
 *
 *          emit(source);
 *        },
 *        pageJsHooks(path, source, emit) {
 *          // TODO 在这里可以对页面js的源代码进行修改,修改完后执行emit方法并传入新的源代码
 *
 *          console.log(`\x1B[1m[TaroTrack]\x1B[0m 【Plugin:pageJsHooks】 ${path}`);
 *          emit(source);
 *        },
 *        appJsHooks(path, source, emit) {
 *          // TODO 在这里可以对appJs的源代码进行修改,修改完后执行emit方法并传入新的源代码
 *
 *          console.log(`\x1B[1m[TaroTrack]\x1B[0m 【Plugin:appJsHooks】 ${path}`);
 *          emit(source);
 *        },
 *        dolphinLibJsHooks(path, source, emit) {
 *          // TODO 在这里可以对dolphinLib，即sdk对小程序注入的库文件的源代码进行修改,修改完后执行emit方法并传入新的源代码
 *
 *          console.log(
 *            `\x1B[1m[TaroTrack]\x1B[0m 【Plugin:dolphinLibJsHooks】 ${path}`
 *          );
 *          emit(source);
 *        }
 *      })
 *   ]
 *   // 省略无关配置...
 * };
 *
 */
export class TaroTrackPlugin {

  constructor(private options: TaroTrackPluginInitOptions={transporterOptions: {env: "development", transporterType: TransporterType.Console, appName: "applet(alpha)", appVersion: "0.0.1"}}) {

  }

  versionChecker(): Promise<string>{
    // console.log('判断版本0');
    return new Promise<string>(resolve => {
      // console.log('判断版本1');
      exec('taro --version', {silent:true,async:true}).stdout.on('data', function(data: string) {
        // console.log('判断版本2', data.replace('\n',''));
        let datas = data.split(/\s/);
        datas = datas.filter(item=>item.match(/^\d*\.\d*\.\d*$/));
        data = datas[0];
        // data = data.replace(/\s/g,'');
        // data = data.replace(/(\d+\.\d+\.\d+).*/m,'').trim().replace('\n','');
        // console.log('获取版本',data, typeof data, taroTargetVersion, typeof taroTargetVersion);
        if(data!==taroTargetVersion&&data){
          console.log('\n');
          logger.warn(`⚠️ ============================================================================================================================`);
          logger.warn(`⚠️ 您当前的taro版本为[v${data}],taro-track/plugins支持在[v${taroTargetVersion}]中运行，请保证taro版本与目标版本一致，以免出现不可预料的问题`);
          logger.warn(`⚠️ ============================================================================================================================\n`);
          console.log('\n');
        }
        resolve(data);
      });
    });
  }

  private TaroTrackSourceInjector: TaroTrackSourceInjector;
  /**
   * taro Plugin默认方法
   * @param builder
   */
  async apply(builder: any): Promise<void> {
    // 编译前钩子，可获取编译配置
    builder.hooks.beforeBuild.tap('BuildPlugin', (config: any) => {
      // console.log(config)
    });
    // 编译后钩子，可以获取输出的源码等信息
    builder.hooks.afterBuild.tap('BuildPlugin', async (stats: any) => {
      await this.versionChecker();

      if(this.TaroTrackSourceInjector){
        await this.TaroTrackSourceInjector.initial(stats, this.options);
      }else{
        this.TaroTrackSourceInjector = new TaroTrackSourceInjector(stats, this.options);
      }

    });
  }
}

