import { writeFileSync } from 'fs-extra';


/**
 * taro框架的文件管理器
 */
export class TaroFileManager {
  // 所有文件路径列表
  private fileNameList: string[] = [];
  // 所有文件列表
  private fileList: any[] = [];
  // taro原始资源对象
  private assets: any;
  // taro编译环境的所有信息
  private ctx: any;

  constructor(ctx: any) {
    this.assets = ctx.compilation.assets;
    this.ctx = ctx;
    this.initial();
  }

  /**
   * 更新编译配置，当taro处于开发模式并且用户修改代码后将会被调用，用以更新编译配置
   * @param ctx
   */
  public updateCtx(ctx: any) {
    this.ctx = ctx;
    this.assets = ctx.compilation.assets;
  }

  /**
   * 进行一些数据的初始化
   */
  private initial() {
    this.fileNameList = Object.keys(this.assets);
    this.fileList = this.fileNameList.map(key => this.assets[key]);
  }

  /**
   * 根据文件类型查询文件
   * @param {string | RegExp} type    文件类型，即包含指定字符串或满足正则表达式的文件路径
   * @param {boolean} exact           是否完全匹配，若为true,必须整个路径等于type才能匹配
   * @returns {string[]}
   */
  private getFileNamesByType(type: string | RegExp, exact = false): string[] {
    return this.fileNameList.filter(fileName => {
      if (typeof type === 'string') {
        if (exact) {
          return fileName === type;
        } else {
          return fileName.indexOf(fileName) >= 0;
        }
      } else {
        return type.exec(fileName);
      }
    });
  }

  /**
   * 获取taro编译的输出目录
   * @returns {string}
   */
  public getOutputPath(): string {
    return this.ctx.compilation.compiler.outputPath;
  }

  /**
   * 根据文件类型获取文件列表
   * @param {string | RegExp} type
   * @param {boolean} exact
   * @returns {{path: string; file: any}[]}
   */
  public getFileListByFileType(type: string | RegExp, exact = false) {
    const targetFileNames = this.getFileNamesByType(type, exact);
    return targetFileNames.map(fileName => ({
      path: fileName,
      file: this.assets[fileName]
    }));
  }

  /**
   * 将文件内容输出到输出目录
   * @param {string} path
   * @param {string | Buffer} content
   * @returns {boolean}
   */
  public outputFile(path: string, content: string | Buffer): boolean {

    try {
      writeFileSync(
        path,
        content
      );
      return true;
    } catch (e) {
      return false;
    }


  }
}
