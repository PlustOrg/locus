import { validateBodyAgainst } from '../../src/runtime/validateRuntime';

const schema: any = { entity: 'User', fields: [ { name: 'email', type: 'string', optional: false, email: true }, { name: 'age', type: 'integer', optional: false, min: 0 } ] };

test('patch omits required fields without error', () => {
  const r = validateBodyAgainst(schema, {}, 'patch');
  expect(r.ok).toBe(true);
});

test('patch validates provided fields', () => {
  const r = validateBodyAgainst(schema, { email: 'not-an-email' }, 'patch');
  expect(r.ok).toBe(false);
  expect(r.errors!.some(e => e.code === 'email')).toBe(true);
});
