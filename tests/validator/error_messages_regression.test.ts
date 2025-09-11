import { parseLocus } from '../../src/parser';
import { validateProject } from '../../src/validator/validate';

test('optional list message stable', () => {
  const ast = parseLocus('database { entity U { tags: list of String } }', 'm.locus');
  (ast.databases[0].entities[0].fields[0].type as any).optional = true; // simulate forbidden shape
  expect(() => validateProject(ast as any)).toThrow(/Optional list type not allowed/);
});
