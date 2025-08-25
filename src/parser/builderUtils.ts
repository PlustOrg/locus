import { IToken } from 'chevrotain';

export function posOf(tok: IToken) {
  return { line: tok.startLine, column: tok.startColumn };
}

export function defineHidden<T extends object, K extends string, V>(obj: T, key: K, value: V) {
  Object.defineProperty(obj, key, { value, enumerable: false, configurable: true });
}
