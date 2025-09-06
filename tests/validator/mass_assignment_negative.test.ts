import { validateBodyAgainst } from '../../src/runtime/validateRuntime';

const schema = { entity: 'User', fields: [ { name: 'age', type: 'integer', optional: false } ] } as any;

test('mass assignment extra field rejected', () => {
  const res = validateBodyAgainst(schema, { age: 20, role: 'admin' }, 'create');
  expect(res.ok).toBe(false);
  expect(res.errors!.some(e => e.code === 'unexpected_property')).toBe(true);
});
