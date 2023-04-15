/* eslint-disable @typescript-eslint/no-explicit-any */

export type Any = any;
export type AnyObject = Record<string, any>;

export type PrimitiveValue = string | number | boolean | null | Array<PrimitiveValue>;
export type Value = PrimitiveValue | Function | {[x: string]: Value} | Array<Value>;

export type View = Record<string, Value>;

export type ViewResolver = (name: string) => Value;
