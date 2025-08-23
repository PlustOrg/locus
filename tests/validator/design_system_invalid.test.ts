import { VError } from '../../src/errors';
import { validateUnifiedAst } from '../../src/validator/validate';

describe('Design system validation', () => {
  function baseUnified(extra: any) {
    return { designSystem: extra, database: { entities: [] } as any } as any;
  }
  test('invalid color hex throws', () => {
    const ds: any = { colors: { light: { primary: { value: 'red', loc: { line: 1, column: 1 } } } } };
    expect(() => validateUnifiedAst(baseUnified(ds))).toThrow(VError);
  });
  test('invalid weight range throws', () => {
    const ds: any = { typography: { weights: { bold: { value: 50, loc: { line: 1, column: 1 } } } } };
    expect(() => validateUnifiedAst(baseUnified(ds))).toThrow(VError);
  });
  test('invalid spacing token name throws', () => {
    const ds: any = { spacing: { 'Bad-Name': { value: '4px', loc: { line: 1, column: 1 } } } };
    expect(() => validateUnifiedAst(baseUnified(ds))).toThrow(VError);
  });
});
