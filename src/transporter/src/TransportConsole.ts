/**
 * @date 2020-09-12
 * @author kinertang
 * @description
 */

import { TransporterCallback } from "@/transporter/src/Transporter";
import { BaseDataType, TaroTrackLoggerNamespace, Pipeline } from '@kiner/taro-track-common';
import { Logger4Node } from '@kiner/taro-track-corejs';

const logger = Logger4Node.create(TaroTrackLoggerNamespace, {
  groupCollapsed: true
});
export class TransporterConsole<T extends BaseDataType> implements Pipeline<T> {

  public constructor() {}
  public send(data: T, callback?: TransporterCallback): void {
    logger.info('TransporterConsole.send上报',data);

    if (callback) {
      callback(null);
    }
  }

  public post(dataArray: T[], callback?: TransporterCallback): void {
    logger.info('TransporterConsole.post上报',...dataArray);

    if (callback) {
      callback(null);
    }
  }

  public push(data: T[]): Promise<void> {
    return new Promise(resolve => {
      logger.info('TransporterConsole压入队列',...data);
      resolve();
    });
  }

  public pipe(next: Pipeline<BaseDataType>) {
    return next;
  }
}
