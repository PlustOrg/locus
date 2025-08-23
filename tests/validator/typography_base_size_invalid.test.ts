import { validateUnifiedAst } from '../../src/validator/validate';
import { VError } from '../../src/errors';

describe('Typography baseSize validation', () => {
  test('invalid unit rejected', () => {
    const ast: any = { designSystem: { typography: { baseSize: { value: '12pt', loc: { line:1, column:1 } } } }, database: { entities: [] } };
    expect(() => validateUnifiedAst(ast)).toThrow(VError);
  });
});
