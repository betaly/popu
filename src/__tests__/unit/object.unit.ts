import {renderObject} from '../../object';
import {renderString} from '../../string';
import {Any} from '../../types';

describe('object', function () {
  function verify(title: string, input: Parameters<typeof renderObject>, output: Any) {
    test(title, () => {
      const result = renderObject(...input);
      expect(output).toEqual(result);
    });
  }

  verify(
    'replace value in nested object',
    [
      {
        foo: {
          bar: '${say.what}',
        },
      },
      {
        say: {what: 'yeah'},
      },
    ],
    {
      foo: {
        bar: 'yeah',
      },
    },
  );

  verify(
    'replace keys',
    [
      {
        'mykeywins${yes}': 'value',
      },
      {yes: 'no'},
    ],
    {mykeywinsno: 'value'},
  );

  verify('boolean', [{woot: true}, {}], {woot: true});

  verify(
    'undefined',
    [
      {
        key: 'value',
        object: {
          nested: undefined,
        },
      },
      [],
    ],
    {
      key: 'value',
      object: {
        nested: undefined,
      },
    },
  );

  verify(
    'array',
    [
      ['foo', 'bar${1}', 'baz${2}'],
      ['ignore me', '-first', '-second'],
    ],
    ['foo', 'bar-first', 'baz-second'],
  );

  verify('number', [{xfoo: 1}, {}], {xfoo: 1});

  verify('nested arrays', ['${some.arrays}', {some: {arrays: [1, [2, [{3: 4}]]]}}], [1, [2, [{3: 4}]]]);

  verify('nested objects', ['${some.object}', {some: {object: {3: {4: 5}}}}], {3: {4: 5}});

  verify(
    'nested arrays in objects and objects in arrays',
    [
      {
        'arrays${some.arrays.0}': '${some.arrays}',
        'object${some.arrays.1.0}': '${some.object}',
      },
      {
        some: {
          arrays: [1, [2, [{3: 4}]]],
          object: {3: {4: 5}},
        },
      },
    ],
    {
      arrays1: [1, [2, [{3: 4}]]],
      object2: {3: {4: 5}},
    },
  );

  verify(
    'custom handler',
    [
      {
        foo: 'hello from ${foo}',
        bar: 'hello from ${bar}',
      },
      {
        foo: 'foo',
        bar: 'bar',
      },
      function (value, view, key) {
        // let's renderObject the corresponding value in a different way
        if (key === 'foo') {
          return value;
        }
        return renderString(value, view);
      },
    ],
    {
      foo: 'hello from ${foo}',
      bar: 'hello from bar',
    },
  );
});
