import { validateBodyAgainst } from '../../src/runtime/validateRuntime';

// minimal synthetic schema with locations
const schema: any = { entity: 'LocEntity', fields: [ { name: 'name', type: 'string', optional: false } ], locations: { name: { line: 10, column: 5 } } };

test('locations metadata surfaces in validation result on failure', () => {
  const r = validateBodyAgainst(schema, {}, 'create');
  expect(r.ok).toBe(false);
  expect(r.locations).toBeDefined();
  expect(r.locations!.name.line).toBe(10);
});
