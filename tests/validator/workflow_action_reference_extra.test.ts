import { parseLocus } from '../../src/parser';
import { validateProject } from '../../src/validator/validate';

test('unknown workflow action still errors (cross-reference)', () => {
  const src = `page Home { action doIt { } } workflow Sample { trigger { on: create(User) } steps { run missing() } } database { entity User { id: Integer } }`;
  const ast = parseLocus(src,'w.locus');
  expect(() => validateProject(ast as any)).toThrow(/unknown action 'missing'/i);
});
