import {PrimitiveValue} from './types';

const isSANB = require('is-string-and-not-blank');

const debug = require('debug')('popu:parse-variable');

/**
 * Parses a variable and returns its value
 *
 * see: https://github.com/ladjs/dotenv-parse-variables/blob/master/src/index.js
 *
 * @param value
 * @param key
 */
export function parseVariable(value: string, key?: string): PrimitiveValue {
  debug(`parsing key ${key} with value ${value}`);

  // if the value is wrapped in bacticks e.g. (`value`) then just return its value
  if (value.toString().indexOf('`') === 0 && value.toString().lastIndexOf('`') === value.toString().length - 1) {
    debug(`key ${key} is wrapped in bacticks and will be ignored from parsing`);
    return value.toString().slice(1, value.toString().length - 1);
  }

  // if the value ends in an asterisk then just return its value
  if (value.toString().lastIndexOf('*') === value.toString().length - 1 && !value.toString().includes(',')) {
    debug(`key ${key} ended in * and will be ignored from parsing`);
    return value.toString().slice(0, Math.max(0, value.toString().length - 1));
  }

  // Boolean
  if (value.toString().toLowerCase() === 'true' || value.toString().toLowerCase() === 'false') {
    debug(`key ${key} parsed as a Boolean`);
    return value.toString().toLowerCase() === 'true';
  }

  // Number
  if (isSANB(value) && !Number.isNaN(Number(value))) {
    debug(`key ${key} parsed as a Number`);
    return Number(value);
  }

  // Array
  if (
    (Array.isArray(value) || typeof value === 'string') &&
    typeof value.includes === 'function' &&
    value.includes(',')
  ) {
    debug(`key ${key} parsed as an Array`);
    return value
      .split(',')
      .filter(string => {
        return string !== '';
      })
      .map(string => parseVariable(string));
  }

  return value;
}
