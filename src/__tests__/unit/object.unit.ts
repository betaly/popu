import {renderObject} from '../../object';
import {template} from '../../template';
import {Any} from '../../types';

describe('object', function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function verify(fn: () => any, output: Any) {
    const result = fn();
    expect(output).toEqual(result);
  }

  it('replace value in nested object', () => {
    verify(() => renderObject({foo: {bar: '${say.what}'}}, {say: {what: 'yeah'}}), {
      foo: {
        bar: 'yeah',
      },
    });
  });

  it('replace keys', () => {
    verify(
      () =>
        renderObject(
          {
            'mykeywins${yes}': 'value',
          },
          {yes: 'no'},
        ),
      {mykeywinsno: 'value'},
    );
  });

  it('boolean', () => {
    verify(() => renderObject({woot: true}, {}), {woot: true});
  });

  it('undefined', () => {
    verify(() => renderObject({key: 'value', object: {nested: undefined}}, []), {
      key: 'value',
      object: {
        nested: undefined,
      },
    });
  });

  it('array', () => {
    verify(
      () => renderObject(['foo', 'bar${1}', 'baz${2}'], ['ignore me', '-first', '-second']),
      ['foo', 'bar-first', 'baz-second'],
    );
  });

  it('number', () => {
    verify(() => renderObject({xfoo: 1}, {}), {xfoo: 1});
  });

  it('nested arrays', () => {
    verify(() => renderObject('${some.arrays}', {some: {arrays: [1, [2, [{3: 4}]]]}}), [1, [2, [{3: 4}]]]);
  });

  it('nested objects', () => {
    verify(() => renderObject('${some.object}', {some: {object: {3: {4: 5}}}}), {3: {4: 5}});
  });

  it('nested arrays in objects and objects in arrays', () => {
    verify(
      () =>
        renderObject(
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
        ),
      {
        arrays1: [1, [2, [{3: 4}]]],
        object2: {3: {4: 5}},
      },
    );
  });

  it('custom handler', () => {
    verify(
      () =>
        renderObject(
          {
            foo: 'hello from ${foo}',
            bar: 'hello from ${bar}',
          },
          {
            foo: 'foo',
            bar: 'bar',
          },
          (value, view, key) => {
            // let's renderObject the corresponding value in a different way
            if (key === 'foo') {
              return value;
            }
            return template(value, view);
          },
        ),
      {
        foo: 'hello from ${foo}',
        bar: 'hello from bar',
      },
    );
  });
});
