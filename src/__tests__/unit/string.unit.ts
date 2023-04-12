import {renderString} from '../../string';
import {AnyObject} from '../../types';

describe('string', () => {
  function verify(title: string, input: [string, AnyObject], output: string | AnyObject) {
    test(title, () => {
      const result = renderString(...input);
      expect(output).toEqual(result);
    });
  }

  verify('no token', ['woot', {}], 'woot');

  verify('token no value', ['${token}', {}], '${token}');

  verify('one token', ['${token}', {token: 'v'}], 'v');

  verify('nested token', ['${foo.bar.baz}', {foo: {bar: {baz: 'baz'}}}], 'baz');

  verify('nested token no value', ['${foo.bar}', {foo: {}}], '${foo.bar}');

  verify('nested token false value', ['${foo.bar}', {foo: {bar: false}}], 'false');

  verify('replace in the middle of string', ['foo bar ${baz} qux', {baz: 'what?'}], 'foo bar what? qux');

  verify('multiple replacements', ['${a} ${woot} bar baz ${yeah}', {a: 'foo', yeah: true}], 'foo ${woot} bar baz true');

  verify('object notation for non-object', ['${a.b.c} what', {a: {b: 'iam b'}}], '${a.b.c} what');

  verify('dots as key names', ['${woot.bar.baz}', {'woot.bar.baz': 'yup'}], 'yup');

  verify(
    'array view',
    [
      'do what ${fields.0}',
      {
        fields: ['first'],
      },
    ],
    'do what first',
  );

  verify(
    'render as object',
    [
      '${foo}',
      {
        foo: {
          bar: 'baz',
        },
      },
    ],
    {bar: 'baz'},
  );

  const date = new Date();
  verify(
    'render as date',
    [
      '${foo}',
      {
        foo: {
          bar: date,
        },
      },
    ],
    {bar: date},
  );
});
