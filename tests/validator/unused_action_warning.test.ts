import { parseLocus } from '../../src/parser';
import { validateProject } from '../../src/validator/validate';

test('unused action produces naming warning', () => {
  const ast: any = parseLocus('page Home { action a { } }','u.locus');
  validateProject(ast as any);
  const warnings = (ast as any).namingWarnings || [];
  expect(warnings.some((w: string)=>/unused action 'a'/i.test(w))).toBeTruthy();
});
