/**
 * @date 2020-09-12
 * @author kinertang
 * @description 队列
 */
import { IteratorProtocol, NextableIteratorProtocolWrapper } from "@/core/src/IteratorProtocol";

export interface QueueNode<T> {
  item: T;
  data: T;
  next: QueueNode<T>;
}

export class QueueIterator<T> {
  private current: QueueNode<T>;

  public constructor(node: QueueNode<T>) {
    this.current = node;
  }

  public hasNext(): boolean {
    return this.current !== null;
  }

  public next(): T {
    if (!this.hasNext()) {
      return null;
    }

    const item: T = this.current.item;
    this.current = this.current.next;

    return item;
  }
}

export class Queue<T> {
  private first: QueueNode<T>;
  private last: QueueNode<T>;
  private count: number;
  private limit: number;

  public constructor(limit?: number) {
    this.first = null;
    this.last = null;
    this.count = 0;
    this.limit = limit || 16;
  }

  public empty(): boolean {
    return this.first === null;
  }

  public length(): number {
    return this.count;
  }

  public size(): number {
    return this.count;
  }

  public clear(): void {
    this.first = null;
    this.last = null;
    this.count = 0;
  }

  // add an item to the queue
  public enqueue(item: T): void {
    if (this.size() >= this.limit) {
      this.dequeue();
    }

    const node: QueueNode<T> = {
      item,
      data: item,
      next: null
    };

    if (this.empty()) {
      this.first = node;
      this.last = node;
    } else {
      this.last.next = node;
      this.last = node;
    }

    this.count = this.count + 1;
  }

  // 删除并返回最先添加的项
  public dequeue(): T {
    if (this.empty()) {
      return null;
    }

    const item: T = this.first.item;
    this.first = this.first.next;
    this.count = this.count - 1;

    return item;
  }

  // return the first item
  public peek(): T {
    if (this.empty()) {
      return null;
    }

    return this.first.item;
  }

  /**
   * @deprecated
   */
  public iterator(): QueueIterator<T> {
    return new QueueIterator<T>(this.first);
  }

  public iterable(): IteratorProtocol<T> {
    return new NextableIteratorProtocolWrapper<T>(this.first);
  }

  public [Symbol.iterator](): IteratorProtocol<T> {
    return this.iterable();
  }
}
