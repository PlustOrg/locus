import { validateBodyAgainst } from '../../src/runtime/validateRuntime';
import { fastValidate } from '../../src/runtime/jitValidator';

const schema: any = { entity: 'JitUser', fields: [ { name: 'email', type: 'string', optional: false, email: true }, { name: 'age', type: 'integer', optional: false, min: 0 } ] };

test('jit agrees with baseline success', () => {
  process.env.LOCUS_VALIDATION_JIT = '1';
  const base = validateBodyAgainst(schema, { email: 'a@b.com', age: 1 }, 'create');
  const jit = fastValidate(schema, { email: 'a@b.com', age: 1 }, 'create');
  expect(base.ok).toBe(true);
  expect(jit.ok).toBe(true);
});

test('jit agrees with baseline failure', () => {
  process.env.LOCUS_VALIDATION_JIT = '1';
  const base = validateBodyAgainst(schema, { email: 'bad', age: 'NaN' }, 'create');
  const jit = fastValidate(schema, { email: 'bad', age: 'NaN' }, 'create');
  expect(base.ok).toBe(false);
  expect(jit.ok).toBe(false);
  expect(base.errors!.map(e=>e.code)).toContain('email');
  expect(jit.errors!.map(e=>e.code)).toContain('email');
});
