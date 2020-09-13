/**
 * @date 2020-09-12
 * @author kinertang
 * @desrciption 队列
 */
import { QueueOptions, IQueue } from "@/src/datasource";
import { isRequired } from '@kiner/taro-track-corejs';



export class NQueue<T> implements IQueue<T> {
  private queues: T[];
  private max: number;

  public constructor(options?: QueueOptions) {
    if (options && isRequired(options.size)) {
      this.max = options.size;
    } else {
      this.max = 6;
    }

    this.queues = [];
  }

  fill(data: T): void {
    for (let i = 0; i < this.max; i++) {
      this.queues.push(data);
    }
  }

  push(data: T): void {
    if (this.count() >= this.max) {
      this.shift();
    }

    this.queues.push(data);
  }

  shift(): T {
    return this.queues.shift();
  }

  first(): T {
    return this.queues[0];
  }

  last(): T {
    return this.queues[this.queues.length - 1];
  }

  count(): number {
    return this.queues.length;
  }

  get(): T[] {
    return this.queues;
  }

  getByIndex(index: number): T {
    return this.queues[index];
  }

  reset(): void {
    this.queues = [];
  }

  toString(): string {
    return this.queues.toString();
  }
}
