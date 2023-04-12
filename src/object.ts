import {renderString} from './string';
import {Any, AnyArray, AnyObject} from './types';

type WalkHandler = (value: string, key?: string) => Any;
export type ObjectHandler = (value: string, view?: AnyObject, key?: string) => Any;

function walkObject(object: AnyArray | AnyObject, handler: WalkHandler) {
  if (Array.isArray(object)) return walkArray(object, handler);
  const result: AnyObject = {};

  for (const key in object) {
    const resolvedKey = walk(key, handler);
    if (typeof resolvedKey !== 'string') {
      throw new Error(`Cannot resolve key ${key} to string`);
    }
    result[resolvedKey] = walk(object[key], handler, key);
  }

  return result;
}

function walkArray(array: AnyArray, handler: WalkHandler) {
  return array.map(function (input) {
    return walk(input, handler);
  });
}

/**
 Walk the object and invoke the function on string types.

 Why write yet-another cloner/walker? The primary reason is we also want to run
 template functions on keys _and_ values which most clone things don't do.

 @param input object to walk and duplicate.
 @param handler handler to invoke on string types.
 @param [key] key corresponding to input, if the latter is a value in object
 */
// function walk(input: string, handler: WalkHandler, key?: string): string;
// function walk(input: AnyObject, handler: WalkHandler): AnyObject;
function walk(input: AnyObject | string, handler: WalkHandler, key?: string): Any {
  switch (typeof input) {
    // object is slightly special if null we move on
    case 'object':
      if (!input) return input;
      return walkObject(input, handler);

    case 'string':
      return handler(input, key);
    // all other types cannot be mutated
    default:
      return input;
  }
}

export function renderObject(object: string | AnyObject, view?: AnyObject, handler?: ObjectHandler) {
  handler = handler || renderString;

  return walk(object, (value, key) => handler?.(value, view, key));
}
