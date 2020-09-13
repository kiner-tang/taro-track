/**
 * @date 2020-09-12
 * @author kinertang
 * @description
 */

function random(c: string): string {
  const r: number = Math.random() * 16 | 0;
  const v: number = c === "x" ? r : (r & 0x3 | 0x8);
  return v.toString(16);
}

export function guid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, random);
}

export function shortid(): string {
  return "xxxx-4xxx-yxxx".replace(/[xy]/g, random);
}
