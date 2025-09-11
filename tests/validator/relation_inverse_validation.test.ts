import { parseLocus } from '../../src/parser';
import { validateProject } from '../../src/validator/validate';

describe('relation inverse validation', () => {
  test('inverse must match existing relation on target', () => {
    const ast = parseLocus('database { entity A { id: Integer bs: has_many B } entity B { id: Integer a: has_one A inverse: foos } }','x.locus');
    expect(() => validateProject(ast as any)).toThrow(/inverse 'foos'.*not found/i);
  });
  test('valid inverse passes', () => {
    const ast = parseLocus('database { entity A { id: Integer bs: has_many B } entity B { id: Integer a: has_one A inverse: bs } }','x.locus');
    expect(() => validateProject(ast as any)).not.toThrow();
  });
});
