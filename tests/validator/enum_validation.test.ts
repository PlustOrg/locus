import { validateBodyAgainst } from '../../src/runtime/validateRuntime';

const schema = { entity: 'Color', fields: [ { name: 'shade', type: 'string', optional: false, enum: ['red','green','blue'] } ] } as any;

test('accepts enum member', () => {
  const r = validateBodyAgainst(schema, { shade: 'red' }, 'create');
  expect(r.ok).toBe(true);
});

test('rejects invalid enum member', () => {
  const r = validateBodyAgainst(schema, { shade: 'purple' }, 'create');
  expect(r.ok).toBe(false);
  expect(r.errors!.some(e => e.code === 'enum')).toBe(true);
});
