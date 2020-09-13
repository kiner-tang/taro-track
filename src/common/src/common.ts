export interface DataTypeObject<T> {
  [key: string]: T;
}

export interface Pipeline<T> {
  push(data: T[]): Promise<void>;
  pipe(next: Pipeline<T>): Pipeline<T>;
}

export type BaseDataType = DataTypeObject<string | number | boolean | object>;
