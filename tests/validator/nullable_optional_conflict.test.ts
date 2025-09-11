import { parseLocus } from '../../src/parser';
import { validateProject } from '../../src/validator/validate';

function build(code: string) { return parseLocus(code, 'main.locus'); }

test('optional list rejected in validation', () => {
  const ast = build('database { entity U { tags: list of String } }');
  // modify AST to simulate optional list (builder forbids but double guard)
  (ast.databases[0].entities[0].fields[0].type as any).optional = true;
  expect(() => validateProject(ast as any)).toThrow(/Optional list type not allowed/);
});

test('optional+nullable conflict rejected', () => {
  const ast = build('database { entity U { age: Integer } }');
  const field: any = ast.databases[0].entities[0].fields[0];
  field.type.optional = true;
  field.type.nullable = true;
  expect(() => validateProject(ast as any)).toThrow(/cannot be both optional and nullable/);
});