import { parseLocus } from '../../src/parser';

test('type alias resolves to primitive', () => {
  const src = `type UserName = String\n database { entity User { name: UserName } }`;
  const ast:any = parseLocus(src,'a.locus');
  const field = ast.databases[0].entities[0].fields[0];
  expect(field.type.name).toBe('String');
});
