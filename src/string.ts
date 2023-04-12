import {Any, AnyObject} from './types';

/**
 Convert a dotted path to a location inside an object.

 @private
 @example

 // returns xfoo
 extractValue('wow.it.works', {
    wow: {
      it: {
        works: 'xfoo'
      }
    }
  });

 // returns undefined
 extractValue('xfoo.bar', { nope: 1 });

 @param {String} path dotted to indicate levels in an object.
 @param {Object} view for the data.
 */
function extractValue(path: string, view: AnyObject) {
  // Short circuit for direct matches.
  if (view?.[path]) return view[path];

  const parts = path.split('.');
  let part;

  while (
    // view should always be truthy as all objects are.
    view &&
    // must have a part in the dotted path
    (part = parts.shift())
  ) {
    view = typeof view === 'object' && part in view ? view[part] : undefined;
  }

  return view;
}

const REGEX = /[%$]\{([a-zA-Z.-_0-9]+)}/g;
const TEMPLATE_OPEN = '${';

/**
 NOTE: I also wrote an implementation that does not use regex but it is actually slower
 in real world usage and this is easier to understand.

 @param {String} input template.
 @param {Object} view details.
 */
export function renderString(input: string, view: AnyObject): Any {
  // optimization to avoid regex calls (indexOf is strictly faster)
  if (input.indexOf(TEMPLATE_OPEN) === -1) return input;
  let result: AnyObject | undefined;
  const replaced = input.replace(REGEX, function (original, path) {
    const value = extractValue(path, view);
    if (undefined === value || null === value) {
      return original;
    }

    if (typeof value === 'object') {
      result = value;
      return;
    }

    return value;
  });
  return result ?? replaced;
}
