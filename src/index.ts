import {renderObject} from './object';
import {renderString} from './string';

export * from './types';
export * from './string';
export * from './object';

export default renderObject;
export const template = renderString;
