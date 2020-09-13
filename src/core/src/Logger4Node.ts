import { blue, white, green, red, yellow, cyan, bold } from 'colors';
import { TaroTrackLoggerNamespace } from '@kiner/taro-track-common';


export enum Logger4NodeType {
  log,
  warn,
  info,
  error,
  success,
  loading
}

export interface Logger4NodeOption {
  groupCollapsed?: boolean,
  showLog?: boolean
}

export class Logger4Node {
  constructor(private namespace: string=TaroTrackLoggerNamespace,private options: Logger4NodeOption={groupCollapsed:false, showLog: true}) {
  }

  public static create(namespace: string=TaroTrackLoggerNamespace,options: Logger4NodeOption){
    return new Logger4Node(namespace, options);
  }

  private addColor(args: any[], colorMethod: (text: string)=>string): any{
    return args.map(arg=>{
      if(typeof arg==="string"){
        return colorMethod(arg);
      }else {
        return arg;
      }
    });
  }

  private baseLog(type: Logger4NodeType, ...rest:any[]){

    const [msg, ...args] = rest;
    if(this.options.showLog===false){
      return;
    }

    let colorMethod: (text: string)=>string;
    switch (type) {
      case Logger4NodeType.log:
        colorMethod = white;
        break;
      case Logger4NodeType.info:
        colorMethod = green;
        break;
      case Logger4NodeType.warn:
        colorMethod = yellow;
        break;
      case Logger4NodeType.error:
        colorMethod = red;
        break;
      case Logger4NodeType.success:
        colorMethod = blue;
        break;
      case Logger4NodeType.loading:
        colorMethod = cyan;
        break;
    }

    if(this.options.groupCollapsed===true){
      const label = `[${this.namespace}:${msg}]`;
      console.group(label);
      args.forEach(item=>{
        console.log(item);
      });
      console.groupEnd();
    }else{
      console.log.apply(console,[bold(white(`[${this.namespace}]`))].concat(this.addColor(rest, colorMethod)));
    }

  }

  log(...args:any[]){
    this.baseLog(Logger4NodeType.log, ...args);
  }

  info(...args: any[]){
    this.baseLog(Logger4NodeType.info, ...args);
  }

  warn(...args: any[]){
    this.baseLog(Logger4NodeType.warn, ...args);
  }
  error(...args: any[]){
    this.baseLog(Logger4NodeType.error, ...args);
  }
  success(...args: any[]){
    this.baseLog(Logger4NodeType.success, ...args);
  }
  loading(...args: any[]){
    this.baseLog(Logger4NodeType.loading, ...args);
  }
}
