import { validateBodyAgainst, registerValidationConstraint } from '../../src/runtime/validateRuntime';

const schema = { entity: 'X', fields: [ { name: 'name', type: 'string', optional: false } ] } as any;

test('plugin constraint invoked and records error', () => {
  const unregister = registerValidationConstraint((field, value, path, push) => {
    if (field.name === 'name' && value === 'bad') push({ path, message: 'Forbidden name', code: 'forbidden_name' });
  });
  const res = validateBodyAgainst(schema, { name: 'bad' }, 'create');
  unregister();
  expect(res.ok).toBe(false);
  expect(res.errors!.some(e => e.code === 'forbidden_name')).toBe(true);
});

test('invalid control chars flagged', () => {
  const r = validateBodyAgainst(schema, { name: 'ok\x01' }, 'create');
  expect(r.ok).toBe(false);
  expect(r.errors!.some(e => e.code === 'invalid_chars')).toBe(true);
});

test('pattern complexity flag', () => {
  const complexSchema = { entity: 'Y', fields: [ { name: 'name', type: 'string', optional: false, pattern: 'x'.repeat(300) } ] } as any;
  const r = validateBodyAgainst(complexSchema, { name: 'anything' }, 'create');
  expect(r.ok).toBe(false);
  expect(r.errors!.some(e => e.code === 'pattern_complexity')).toBe(true);
});
