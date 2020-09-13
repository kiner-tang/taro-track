/**
 * @date 2020-09-12
 * @author kinertang
 * @desrciption 队列接口对象
 */

export interface QueueOptions {
  size: number;
}

export interface Queue<T> {
  fill(data: T): void;
  push(data: T): void;
  shift(): T;
  first(): T;
  last(): T;
  count(): number;
  get(): T[];
  getByIndex(index: number): T;
  reset(): void;
  toString(): string;
}
