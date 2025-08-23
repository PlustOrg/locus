import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

function unify(src: string) {
  const ast = parseLocus(src, 'test.locus');
  return mergeAsts([ast as any]);
}

describe('Integer default range validation', () => {
  test('in-range integer default passes', () => {
    const unified = unify('database { entity Foo { val: Integer (default: 123) } }');
    expect(() => validateUnifiedAst(unified as any)).not.toThrow();
  });
  test('out-of-range integer default fails', () => {
    const unified = unify('database { entity Foo { val: Integer (default: 999999999999) } }');
    expect(() => validateUnifiedAst(unified as any)).toThrow(/out of range/);
  });
  test('non-integer decimal default fails', () => {
    const unified = unify('database { entity Foo { val: Integer (default: 12.5) } }');
    expect(() => validateUnifiedAst(unified as any)).toThrow(/out of range|Integer default/);
  });
});
