import { validateUnifiedAst } from '../../src/validator/validate';

describe('Color case insensitivity', () => {
  test('uppercase hex accepted', () => {
    const ast: any = { designSystem: { colors: { light: { primary: { value: '#ABCDEF', loc: { line:1, column:1 } } } } }, database: { entities: [] } };
    expect(() => validateUnifiedAst(ast)).not.toThrow();
  });
});
