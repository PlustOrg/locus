import { validateBodyAgainst } from '../../src/runtime/validateRuntime';

const dateSchema: any = { entity: 'Evt', fields: [ { name: 'ts', type: 'datetime', optional: false } ] };
const bigSchema: any = { entity: 'Ledger', fields: [ { name: 'amount', type: 'bigint', optional: false } ] };

test('datetime canonicalization succeeds with ISO', () => {
  const body: any = { ts: '2023-01-02T03:04:05Z' };
  const r = validateBodyAgainst(dateSchema, body, 'create');
  expect(r.ok).toBe(true);
  expect(body.ts).toBe('2023-01-02T03:04:05.000Z');
});

test('datetime invalid format flagged', () => {
  const r = validateBodyAgainst(dateSchema, { ts: '02-03-2023' }, 'create');
  expect(r.ok).toBe(false);
  expect(r.errors!.some(e => e.code === 'date_format')).toBe(true);
});

test('bigint normalization from bigint literal', () => {
  const body: any = { amount: BigInt(123) };
  const r = validateBodyAgainst(bigSchema, body, 'create');
  expect(r.ok).toBe(true);
  expect(typeof body.amount).toBe('string');
  expect(body.amount).toBe('123');
});

test('bigint invalid string', () => {
  const r = validateBodyAgainst(bigSchema, { amount: '12a' }, 'create');
  expect(r.ok).toBe(false);
  expect(r.errors!.some(e => e.code === 'bigint_format')).toBe(true);
});

test('validation opt-out env bypasses errors', () => {
  process.env.LOCUS_VALIDATION_DISABLE = '1';
  const r = validateBodyAgainst(dateSchema, { ts: 'not-a-date' }, 'create');
  expect(r.ok).toBe(true);
  delete process.env.LOCUS_VALIDATION_DISABLE;
});
