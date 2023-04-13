/* eslint-disable @typescript-eslint/no-explicit-any */

export type Any = any;
export type AnyObject = Record<string, any>;

export type Value = string | number | boolean | void | null | Function | {[x: string]: Value} | Array<Value>;

export type View = Record<string, Value>;

export type ViewResolver = (name: string) => Value;
