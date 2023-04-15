import {Any, AnyObject, Value, View, ViewResolver} from './types';
import {RenderError} from './error';

export type Result = {
  value?: Value;
  error?: {position?: number; message: string};
};

export type Options = {
  view?: View | ViewResolver;
  specialVars?: string[];
  ignoreErrors?: boolean;
};

type Context = {
  view: ViewResolver;
  cachedView: View;
  specialVars?: string[];
  ignoreErrors: boolean;
};

function createResolverFromMapping(obj: AnyObject): ViewResolver {
  return name => obj[name];
}

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
 @param {ViewResolver} resolve view object to resolve the path against.
 */
function extractValue(path: string, resolve: ViewResolver) {
  // Short circuit for direct matches.
  const value = resolve(path);
  if (value !== undefined || path.indexOf('.') < 0) {
    return value;
  }

  const parts = path.split('.');
  let part: string | undefined;
  let answer = resolve(parts.shift()!);
  while (
    // view should always be truthy as all objects are.
    answer &&
    // must have a part in the dotted path
    (part = parts.shift())
  ) {
    // get value from object by string key or array by numeric index
    answer = typeof answer === 'object' ? (answer as Any)[part] : undefined;
  }

  return answer;
}

function resolveVariable(context: Context, name: string) {
  if (name in context.cachedView) {
    let value = context.cachedView[name];
    if (typeof value === 'function') {
      value = value();
    }
    return value;
  } else {
    let value = extractValue(name, context.view);
    context.cachedView[name] = value;
    if (typeof value === 'function') {
      value = value();
    }
    return value;
  }
}

function substituteVariable(variable: string, context: Context) {
  let value;
  const s = variable.split(':', 2);
  if (s.length === 2) {
    const [name, modifier] = s;
    value = resolveVariable(context, name);
    if (modifier[0] === '+') {
      // Substitute replacement, but only if variable is defined and nonempty. Otherwise, substitute nothing
      value = value ? modifier.substring(1) : '';
    } else if (modifier[0] === '-') {
      // Substitute the value of variable, but if that is empty or undefined, use default instead
      value = value || modifier.substring(1);
    } else if (modifier[0] === '#') {
      // Substitute with the length of the value of the variable
      value = value !== undefined ? String(value).length : 0;
    } else if (modifier[0] === '=') {
      // Substitute the value of variable, but if that is empty or undefined, use default instead and set the variable to default
      if (!value) {
        value = modifier.substring(1);
        context.cachedView[name] = value;
      }
    } else if (modifier[0] === '?') {
      // If variable is defined and not empty, substitute its value. Otherwise, print message as an error message.
      if (!value) {
        if (modifier.length > 1) {
          return {error: {message: name + ': ' + modifier.substring(1)}};
        } else {
          return {error: {message: name + ': parameter null or not set'}};
        }
      }
    }
  } else {
    value = resolveVariable(context, variable);
  }
  return {value};
}

function substituteVariablesInternal(str: string, position: number, result: Value, context: Context): Result {
  if (position === -1 || !str) {
    return {value: result};
  } else {
    let index = str.indexOf('$', position);

    if (index === -1) {
      // no $
      if (str.length > position) {
        result += str.substring(position);
      }
      return {value: result};
    } else {
      // $ found
      let variable;
      let endIndex;
      result += str.substring(position, index);

      if (str.charAt(index + 1) === '{') {
        // ${VAR}
        endIndex = str.indexOf('}', index);
        if (endIndex === -1) {
          // '}' not found
          if (context.ignoreErrors) {
            variable = str.substring(index + 2);
          } else {
            return {
              value: result,
              error: {position, message: 'unexpected EOF while looking for matching }'},
            };
          }
        } else {
          // '}' found
          variable = str.substring(index + 2, endIndex);
          endIndex++;
        }
        if (!variable) {
          result += '${}';
        }
      } else {
        // $VAR
        index++; // skip $
        endIndex = -1;
        // special single char vars
        if (context.specialVars && context.specialVars.indexOf(str[index]) !== -1) {
          variable = str[index];
          endIndex = index + 1;
        } else {
          // search for var end
          for (let i = index, len = str.length; i < len; i++) {
            const code = str.charCodeAt(i);
            if (
              !(code > 47 && code < 58) && // numeric
              !(code > 64 && code < 91) && // upper alpha
              code !== 95 && // underscore
              !(code > 96 && code < 123)
            ) {
              // lower alpha
              endIndex = i;
              break;
            }
          }

          if (endIndex === -1) {
            // delimiter not found
            variable = str.substring(index);
          } else {
            // delimited found
            variable = str.substring(index, endIndex);
          }
        }
        if (!variable) {
          result += '$';
        }
      }
      position = endIndex;
      if (!variable) {
        return substituteVariablesInternal(str, position, result, context);
      } else {
        const {error, value} = substituteVariable(variable, context);
        if (error && !context.ignoreErrors) {
          return {error, value};
        }
        if (value != null) {
          result = !result ? value : result + String(value);
        }
        return substituteVariablesInternal(str, position, result, context);
      }
    }
  }
}

/**
 * Substitute all the occurrences of environ variables in a text
 *
 * @param {String} text - Text with variables to be substituted
 * @param {Object|Function} view - View to resolve variables
 * @param {Object} options - Options
 * @param {Object|Function} options.env - Environ variables
 * @param {String|array} options.specialVars - List of special (single char) variables
 * @param {Boolean} options.ignoreErrors - Ignore errors
 */
export function template(text: string, view: View | ViewResolver, options: Options = {}) {
  view = typeof view === 'function' ? view : createResolverFromMapping(view != null ? view : {});
  const context: Context = {
    view,
    cachedView: {},
    specialVars: options.specialVars,
    ignoreErrors: !!options.ignoreErrors,
  };
  const {value, error} = substituteVariablesInternal(text, 0, '', context);
  if (error) {
    throw new RenderError(error.message, error.position);
  }
  return value;
}
