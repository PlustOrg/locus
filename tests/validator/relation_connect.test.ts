import { validateBodyAgainst } from '../../src/runtime/validateRuntime';

const schema: any = { entity: 'Order', fields: [ { name: 'total', type: 'integer', optional: false, min: 0 } ], relations: ['user','items'], locations: {} };

test('relation connect object valid', () => {
  const r = validateBodyAgainst(schema, { total: 10, user: { connect: { id: 'u1' } } }, 'create');
  expect(r.ok).toBe(true);
});

test('relation connect array valid', () => {
  const r = validateBodyAgainst(schema, { total: 5, items: [ { connect: { id: 1 } }, { connect: { id: 2 } } ] }, 'create');
  expect(r.ok).toBe(true);
});

test('relation missing connect flagged', () => {
  const r = validateBodyAgainst(schema, { total: 5, user: { id: 'u1' } }, 'create');
  expect(r.ok).toBe(false);
  expect(r.errors!.some(e => e.code === 'relation_shape')).toBe(true);
});

test('relation connect invalid id type', () => {
  const r = validateBodyAgainst(schema, { total: 5, user: { connect: { id: {} } } }, 'create');
  expect(r.ok).toBe(false);
  expect(r.errors!.some(e => e.code === 'relation_shape')).toBe(true);
});
