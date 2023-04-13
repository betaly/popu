# popu

> Object populate/template tools
>
> ts version of [json-templater](https://www.npmjs.com/package/json-templater)

## Usage: renderString

The string submodule is a very simple mustache like variable replacement with no special features:

```ts
import {renderString} from 'popu';
renderString('${xfoo} ${say.what}', {xfoo: 'yep', say: {what: 'yep'}});
// yep yep
```

## Usage: renderObject

The much more interesting part of this module is the object sub-module which does a deep clone and runs strings through
renderString (including keys!)

`config.json:`

```json
{
  "magic_key_${magic}": {
    "key": "interpolation is nice ${value}"
  }
}
```

```ts
import {renderObject} from 'popu';
renderObject(require('./template.json'), {magic: 'key', value: 'value'});
```

result:

```json
{
  "magic_key_key": {
    "key": "interpolation is nice value"
  }
}
```

### Custom render

You can override default renderer using the third argument in `object` (`renderString` is default):

`template.json:`

```json
{
  "magic": {
    "key": "interpolation is nice ${value}"
  }
}
```

```ts
import popu from 'popu';

popu(require('./template.json'), {magic: 'key', value: 'value'}, (value, data, key) => {
  return value;
});
```

result:

```json
{
  "magic": {
    "key": "interpolation is nice ${value}"
  }
}
```

#### key reference

Handler function gets three arguments:

- `value`: value which is about to be handled
- `data`: initial data object
- `key`: key corresponding to the value

Using this data some complex logic could be implemented, for instance:

```js
import popu, {renderString} from 'popu';

popu(require('./template.json'), {magic: 'key', value: 'value'}, (value, data, key) => {
  // custom renderer for some special value
  if (key === 'specialKey') {
    return 'foo';
  }
  // usual string renderer
  return renderString(value, data);
});
```

result:

```json
{
  "magic": {
    "specialKey": "foo",
    "key": "interpolation is nice value"
  }
}
```

## Parameter Expansion

`popu` supports parameter expansion in view like environment files. Parameter expansion is applied for unquoted and
double-quoted values. Both braced (${VAR}) and unbraced ($VAR) expressions are supported.

For braced expressions, the following formats are supported:

- Direct substitution

  - `${VAR}` -> value of `VAR`

- Default value

  - `${VAR:-default}` -> value of `VAR` if set and non-empty, otherwise `default`
  - `${VAR:=default}` -> value of `VAR` if set and non-empty, otherwise `default` and set `VAR` to `default`

- Required value

  - `${VAR:?error}` -> value of `VAR` if set and non-empty, otherwise exit with error

- Alternative value

  - `${VAR:+replacement}` -> `replacement` if `VAR` is set and non-empty, otherwise empty

- Length of value
  - `${VAR:#}` -> length of value of `VAR` if set and non-empty, otherwise 0

[more usage examples](src/__tests__/unit/string.unit.ts)

## Credits

- [json-templater](https://www.npmjs.com/package/json-templater) for the idea
- [var-expansion](https://www.npmjs.com/package/var-expansion) for the string renderer
