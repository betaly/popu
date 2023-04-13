import {renderString} from '../../string';
import {AnyObject} from '../../types';
import {RenderError} from '../../error';

describe('render string', function () {
  describe('flat', function () {
    const line0 = 'la vispa ${name} altro testo $BOH noo$questoXX prova${A}aa';
    const env = {
      name: 'ciccio',
      questoXX: 'aahhh',
      BOH: 1,
      PWD: '/Users/andreax',
      '?': 0,
      f: function () {
        return 295;
      },
      $: 12345,
    };

    it('should accept empty environ', function () {
      const value = renderString(line0, {});
      expect(value).toEqual('la vispa  altro testo  noo provaaa');
    });

    it('should accept empty strings', function () {
      const value = renderString('', {});
      expect(value).toEqual('');
    });

    it('should substitute a var', function () {
      const value = renderString(line0, {BOH: 1});
      expect(value).toEqual('la vispa  altro testo 1 noo provaaa');
    });

    it('should substitute multiple vars', function () {
      const value = renderString(line0, env);
      expect(value).toEqual('la vispa ciccio altro testo 1 nooaahhh provaaa');
    });

    it('should substitute ${BOH}', function () {
      const value = renderString('${BOH}', env);
      expect(value).toEqual('1');
    });

    it('should substitute $BOH', function () {
      const value = renderString('$BOH', env);
      expect(value).toEqual('1');
    });

    it('should raise error ${BOH', function () {
      // const {error} = renderString('${BOH', env);
      // expect(error).toEqual({
      //   message: 'unexpected EOF while looking for matching }',
      //   position: 0,
      // });
      expect(() => renderString('${BOH', env)).toThrowError(
        new RenderError('unexpected EOF while looking for matching }', 0),
      );
    });

    it('should preserve spaces', function () {
      const value = renderString(' $BOH ', {BOH: 'abc'});
      expect(value).toEqual(' abc ');
    });

    it('should preserve $', function () {
      const value = renderString('$ ${} $', {});
      expect(value).toEqual('$ ${} $');
    });

    it('should substite $PWD/test', function () {
      const value = renderString('$PWD/test', env);
      expect(value).toEqual('/Users/andreax/test');
    });

    it('should expand ${PWD:+ciccio}', function () {
      const value = renderString('${PWD:+ciccio}', env);
      expect(value).toEqual('ciccio');
    });

    it('should expand ${AAA:+bla}', function () {
      const value = renderString('${AAA:+bla}', env);
      expect(value).toEqual('');
    });

    it('should expand ${PWD:-ciccio}', function () {
      const value = renderString('${PWD:-ciccio}', env);
      expect(value).toEqual('/Users/andreax');
    });

    it('should expand ${AAA:-bla}', function () {
      const value = renderString('${AAA:-bla}', env);
      expect(value).toEqual('bla');
    });

    it('should expand ${PWD:#} ${BBB:#}', function () {
      const value = renderString('${PWD:#} ${BBB:#}', env);
      expect(value).toEqual('14 0');
    });

    it('should expand ${NEWVAR} ${NEWVAR:=newval} ${NEWVAR} ${NEWVAR:=oldval}', function () {
      const value = renderString('${NEWVAR} ${NEWVAR:=newval} ${NEWVAR} ${NEWVAR:=oldval}', env);
      expect(value).toEqual(' newval newval newval');
    });

    it('should expand ${NEWVARx:?} 1 2 3', function () {
      // const {error} = renderString('${NEWVARx:?} 1 2 3', env);
      // expect(error).toEqual({message: 'NEWVARx: parameter null or not set'});
      expect(() => renderString('${NEWVARx:?} 1 2 3', env)).toThrowError('NEWVARx: parameter null or not set');
    });

    it('should expand ${NEWVARx:?has not been set} 1 2 3', function () {
      // const {error} = renderString('${NEWVARx:?has not been set} 1 2 3', env);
      // expect(error).toEqual({message: 'NEWVARx: has not been set'});
      expect(() => renderString('${NEWVARx:?has not been set} 1 2 3', env)).toThrowError('NEWVARx: has not been set');
    });

    it('should execute functions', function () {
      const value = renderString('${f}', env);
      expect(value).toEqual('295');
    });

    // it('should expand $? $$', function () {
    //   const value = renderString('$? $$', env, {
    //     specialVars: ['$', '?'],
    //   });
    //   expect(value).toEqual('0 12345');
    // });

    it('should accept function as env', function () {
      const vars: AnyObject = {
        A: 1,
        B: 2,
      };
      const value = renderString('$A + $B = 3', name => vars[name]);
      expect(value).toEqual('1 + 2 = 3');
    });
  });

  describe('nested', function () {
    function verify(input: [string, AnyObject], output: string | AnyObject) {
      const result = renderString(...input);
      expect(result).toEqual(output);
    }

    it('no token', () => {
      verify(['woot', {}], 'woot');
    });

    it('token no value', () => {
      verify(['${token}', {}], '');
    });

    it('one token', () => {
      verify(['${token}', {token: 'v'}], 'v');
    });

    it('nested token', () => {
      verify(['${foo.bar.baz}', {foo: {bar: {baz: 'baz'}}}], 'baz');
    });

    it('nested token no value', () => {
      verify(['${foo.bar}', {foo: {}}], '');
    });

    it('nested token false value', () => {
      verify(['${foo.bar}', {foo: {bar: false}}], 'false');
    });

    it('replace in the middle of string', () => {
      verify(['foo bar ${baz} qux', {baz: 'what?'}], 'foo bar what? qux');
    });

    it('multiple replacements', () => {
      verify(['${a} ${woot} bar baz ${yeah}', {a: 'foo', yeah: true}], 'foo  bar baz true');
    });

    it('object notation for non-object', () => {
      verify(['${a.b.c} what', {a: {b: 'iam b'}}], ' what');
    });

    it('dots as key names', () => {
      verify(['${woot.bar.baz}', {'woot.bar.baz': 'yup'}], 'yup');
    });

    it('array view', () => {
      verify(
        [
          'do what ${fields.0}',
          {
            fields: ['first'],
          },
        ],
        'do what first',
      );
    });
  });
});
