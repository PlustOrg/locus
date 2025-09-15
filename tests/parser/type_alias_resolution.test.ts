import { parseLocus } from '../../src/parser';

test('type alias substitution maps to primitive type', () => {
  const src = `type ID = UUID\n database { entity User { id: ID } }`;
  const ast = parseLocus(src, 'alias.locus');
  const user = ast.databases[0].entities.find(e=>e.name==='User')!;
  const idField: any = user.fields.find(f=>f.name==='id');
  expect(idField).toBeTruthy();
  // Current implementation replaces tokens directly; alias metadata may be absent.
  expect(idField.type.name).toBe('UUID');
});
