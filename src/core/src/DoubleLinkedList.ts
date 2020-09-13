/**
 * @date 2020-09-12
 * @author kinertang
 * @description 双向链表
 * @see https://www.cnblogs.com/Dylansuns/p/6784582.html
 */
import { IteratorProtocol, Nextable, NextableIteratorProtocolWrapper } from "@/core/src/IteratorProtocol";


export class Node<T> implements Nextable<T> {
  public data: T;
  public prev: Node<T>;
  public next: Node<T>;

  public constructor(data: T, prev: Node<T>, next: Node<T>) {
    this.data = data;
    this.prev = prev;
    this.next = next;
  }
}

export class DoubleLinkedList<T> {
  private header: Node<T>;
  private tail: Node<T>;
  private size: number;

  public constructor() {
    this.header = null;
    this.tail = null;
    this.size = 0;
  }

  private getByIndex(index: number): Node<T> {
    if (index < 0 || index > this.size - 1) {
      return null;
    }

    const n: number = this.size / 2;

    if (index <= n) {
      // 从header节点开始
      let current: Node<T> = this.header;

      for (let i = 0; i <= n && current !== null; i++ , current = current.next) {
        if (i === index) {
          return current;
        }
      }
    } else {
      // 从tail节点开始
      let current: Node<T> = this.tail;

      for (let i = this.size - 1; i > n && current !== null; i-- , current = current.prev) {
        if (i === index) {
          return current;
        }
      }
    }

    return null;
  }

  public length(): number {
    return this.size;
  }

  public get(index: number): T {
    const node: Node<T> = this.getByIndex(index);
    return node ? node.data : null;
  }

  public getNode(index: number): Node<T> {
    return this.getByIndex(index);
  }

  // 查找链式线性表中指定元素的索引
  public locate(element: T): number {
    let current = this.header;

    for (let i = 0; i < this.size && current !== null; i++ , current = current.next) {
      if (current.data === element) {
        return i;
      }
    }

    return -1;
  }

  // 采用尾插法为链表添加新节点
  public add(element: T): void {
    if (this.header === null) {
      this.header = new Node<T>(element, null, null);
      this.tail = this.header;
    } else {
      const node: Node<T> = new Node<T>(element, this.tail, null);
      this.tail.next = node;
      this.tail = node;
    }

    this.size++;
  }

  public addAtHeader(element: T): void {
    const newHead = new Node<T>(element, null, this.header);
    this.header.prev = newHead;
    this.header = newHead;

    if (this.tail === null) {
      this.tail = this.header;
    }

    this.size++;
  }

  // 向线性链表的指定位置插入一个元素
  public insert(element: T, index: number): void {
    if (index < 0 || index > this.size) {
      return;
    }

    if (this.header === null) {
      this.add(element);
    } else {
      if (index === 0) {
        this.addAtHeader(element);
      } else {
        // 获取插入点的前一个节点
        const prev: Node<T> = this.getByIndex(index - 1);
        // 获取插入点的节点
        const next: Node<T> = prev.next;
        // 让新节点的next引用指向next节点，prev引用指向prev节点
        const node: Node<T> = new Node<T>(element, prev, next);

        // 让prev的next节点指向新节点
        prev.next = node;
        // 让prev的下一个节点的prev指向新节点
        next.prev = node;

        this.size++;
      }
    }
  }

  // 删除链式线性表中指定索引处的元素
  public delete(index: number): T {
    if (index < 0 || index > this.size - 1) {
      return null;
    }

    let node: Node<T> = null;

    if (index === 0) {
      node = this.header;
      this.header = this.header ? this.header.next : null;

      // 释放新的header节点的prev引用
      if (this.header !== null) {
        this.header.prev = null;
      }
    } else {
      const prev: Node<T> = this.getByIndex(index - 1);

      node = prev.next;
      prev.next = node.next;

      if (node.next !== null) {
        node.next.prev = prev;
      }

      if (this.tail === node) {
        this.tail = prev;
      }

      node.prev = null;
      node.next = null;
    }

    this.size--;

    return node.data;
  }

  // 删除链式线性表中最后一个元素
  public remove(): T {
    return this.delete(this.size - 1);
  }

  public empty(): boolean {
    return this.size === 0;
  }

  public toArray(): T[] {
    const list: T[] = [];

    for (const item of this) {
      list.push(item);
    }

    return list;
  }

  public clear(): void {
    this.header = null;
    this.tail = null;
    this.size = 0;
  }

  public display(): void {}

  public iterator(): IteratorProtocol<T> {
    return new NextableIteratorProtocolWrapper<T>(this.header);
  }

  public [Symbol.iterator](): IteratorProtocol<T> {
    return this.iterator();
  }
}
