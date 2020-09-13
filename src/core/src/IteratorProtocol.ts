/**
 * @date 2020-09-12
 * @author kinertang
 * @description
 * @see https://tc39.es/ecma262/#sec-iteration
 */

export interface IteratorProtocolNextResult<T> {
  done: boolean;
  value: T;
}
export interface IteratorProtocol<T> {
  next(): IteratorProtocolNextResult<T>;
}

export interface Nextable<T> {
  next: Nextable<T> | null;
  data: T;
}

export class NextableIteratorProtocolWrapper<T> implements IteratorProtocol<T> {
  private node: Nextable<T>;

  public constructor(node: Nextable<T>) {
    this.node = node;
  }

  public next(): { done: boolean; value: T } {
    const c: Nextable<T> = this.node;

    if (c === null) {
      return { done: true, value: null };
    }

    this.node = c.next;
    return {
      done: false,
      value: c.data
    };
  }
}
