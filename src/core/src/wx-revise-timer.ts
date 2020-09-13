/**
 * @date 2020-09-12
 * @author kinertang
 * @description 定义一个计时器，修正页面hidden时的计时异常
 */

export interface PageVisibilityProps {
  hidden: boolean;
  event: string;
}

export async function getPageVisibilityProps(): Promise<PageVisibilityProps> {
  return new Promise(resolve => {
    wx.onAppHide(()=>{
      resolve({
        hidden: true,
        event: 'onAppHide'
      })
    });
  });
}



interface ReviseTimerCounter {
  begin: number;     // 开始计算时间
  prev: number;      // 上一次页面进入hidden状态的时间
  counter: number;   // 统计计算时段内总共进入hidden状态的时间
}

interface ReviseTimerStore {
  [key: number]: ReviseTimerCounter;
}

interface EndCallback {
  (time: number): void;
}

export class WxReviseTimer {
  public static PageVisibilityProps: PageVisibilityProps;

  // 运行环境是否支持
  private static ReviseTimerSupported: boolean =  true;
  private static ReviseTimerStore: ReviseTimerStore = {};
  private static ReviseTimerIds: number = 0;
  // 统计当前有多少个计时器
  private static ReviseTimerPCSCounter: number = 0;
  // 是否绑定了visiblilitychange事件监听
  private static ListenerBinded: boolean = false;
  private static HiddenStatus: boolean ;
  private static EndCallbacks: [number, EndCallback][] = [];

  /**
   * 遍历所有的ReviseTimerCounter
   */
  private static each(handle: (counter?: ReviseTimerCounter) => void): void {
    for (const id in WxReviseTimer.ReviseTimerStore) {
      if (WxReviseTimer.ReviseTimerStore.hasOwnProperty(id)) {
        handle(WxReviseTimer.ReviseTimerStore[id]);
      }
    }
  }

  /**
   * 页面进入hidden状态时，开始计时
   * 页面进入visible状态时，将该次hidden状态所耗时间汇总到counter上
   */
  private static reviser(): void {
    if (!WxReviseTimer.ReviseTimerSupported) {
      return;
    }

    const time: number = Date.now();

    wx.onAppHide(()=>{
      WxReviseTimer.HiddenStatus = true;
      WxReviseTimer.each(function(counter: ReviseTimerCounter): void {
        counter.prev = time;
      });
    });
    wx.onAppShow(()=>{
      WxReviseTimer.HiddenStatus = false;
      WxReviseTimer.each(function(counter: ReviseTimerCounter): void {
        counter.counter = counter.counter + time - counter.prev;
        counter.prev = time;
      });
    });

    WxReviseTimer.emit();
  }

  private static emit() {
    WxReviseTimer.EndCallbacks.forEach(function(record: [number, EndCallback]): void {
      const time: number = Date.now();
      const id: number = record[0];
      const callback: EndCallback = record[1];

      if (!WxReviseTimer.ReviseTimerStore[id]) {
        callback(-1);
        return;
      }

      if (!WxReviseTimer.ReviseTimerSupported) {
        callback(time - WxReviseTimer.ReviseTimerStore[id].begin);
        return;
      }

      const counter: ReviseTimerCounter = WxReviseTimer.ReviseTimerStore[id];
      const value: number = time - counter.begin - counter.counter;

      delete WxReviseTimer.ReviseTimerStore[id];

      callback(value);
    });

    WxReviseTimer.EndCallbacks = [];
  }

  /**
   * 开始计时
   *
   * 生产一个唯一id并初始化一个ReviseTimerCounter绑定到id上
   * 返回id
   */
  public static start(): number {
    const id: number = WxReviseTimer.ReviseTimerIds++;
    const time: number = Date.now();
    const counter: ReviseTimerCounter = {
      begin: time,
      prev: time,
      counter: 0
    };

    WxReviseTimer.ReviseTimerPCSCounter++;
    WxReviseTimer.ReviseTimerStore[id] = counter;

    if (!WxReviseTimer.ReviseTimerSupported) {
      return id;
    }

    if (!WxReviseTimer.ListenerBinded) {
      wx.onAppHide(()=>{
        WxReviseTimer.reviser();
      });
      WxReviseTimer.ListenerBinded = true;
    }

    return id;
  }

  /**
   * 结束计时，必须传入id，该id为start方法返回的值
   * 此处必须使用callback的方式来保证end函数的代码后于visibilitychange事件（也就是ReviseTimer.reviser函数）执行
   */
  public static end(id: number, callback: EndCallback): void {
    WxReviseTimer.EndCallbacks.push([id, callback]);

    if (!WxReviseTimer.HiddenStatus) {
      WxReviseTimer.emit();
    }

    return;
  }
}
