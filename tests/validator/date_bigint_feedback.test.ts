import { validateBodyAgainst } from '../../src/runtime/validateRuntime';
import { getValidationFeedback } from '../../src/runtime/validationFeedback';

const dateSchema: any = { entity: 'Event', fields: [ { name: 'ts', type: 'datetime', optional: false } ] };
const bigSchema: any = { entity: 'Ledger2', fields: [ { name: 'amount', type: 'bigint', optional: false } ] };

test('date canonicalization success', () => {
  const body: any = { ts: '2023-02-03T04:05:06Z' };
  const r = validateBodyAgainst(dateSchema, body, 'create');
  expect(r.ok).toBe(true);
  expect(body.ts).toBe('2023-02-03T04:05:06.000Z');
});

test('bigint normalization strategies', () => {
  const b1: any = { amount: BigInt(5) };
  const r1 = validateBodyAgainst(bigSchema, b1, 'create');
  expect(r1.ok).toBe(true);
  expect(typeof b1.amount).toBe('string');
  const r2 = validateBodyAgainst(bigSchema, { amount: 'XYZ' }, 'create');
  expect(r2.ok).toBe(false);
  expect(r2.errors!.some(e=>e.code==='bigint_format')).toBe(true);
});

test('feedback snapshot collects counts', () => {
  const snap = getValidationFeedback();
  // Some entries should exist (non-deterministic exact order)
  expect(Array.isArray(snap)).toBe(true);
  expect(snap.some(s => s.entity === 'Ledger2')).toBe(true);
});
