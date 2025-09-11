import { parseLocus } from '../../src/parser';
import { validateProject } from '../../src/validator/validate';

function build(code: string) { return parseLocus(code, 'main.locus'); }

describe('primitive constraint validation', () => {
  test('min/max only allowed on numeric types', () => {
    const ast = build('database { entity U { name: String @min(3) } }');
    expect(() => validateProject(ast as any)).toThrow(/@min.*numeric/i);
  });
  test('length only allowed on string/text types', () => {
    const ast = build('database { entity U { age: Integer @length(1,3) } }');
    expect(() => validateProject(ast as any)).toThrow(/@length.*string/i);
  });
  test('valid uses pass', () => {
    const ast = build('database { entity U { age: Integer @min(1) @max(10) name: String @length(1,10) } }');
    expect(() => validateProject(ast as any)).not.toThrow();
  });
});
