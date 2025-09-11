import { parseLocus } from '../../src/parser';
import { validateProject } from '../../src/validator/validate';

const build = (code: string) => parseLocus(code, 'main.locus');

describe('relation cardinality validation', () => {
  test('multiple has_one to same target rejected', () => {
    const ast = build('database { entity A { id: Integer } entity B { r1: has_one A r2: has_one A } }');
    expect(() => validateProject(ast as any)).toThrow(/duplicate has_one.*A/i);
  });
});
