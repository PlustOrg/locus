import { validateBodyAgainst, validationErrorEnvelope } from '../../src/runtime/validateRuntime';

const schema: any = { entity: 'RateUser', fields: [ { name: 'age', type: 'integer', optional: false, min: 0 } ] };

test('error envelope includes version', () => {
  const env = validationErrorEnvelope([{ path: 'x', message: 'err', code: 'min' }]);
  expect(env.version).toBe(1);
});

test('rate limit meta flag triggers after threshold', () => {
  process.env.LOCUS_VALIDATION_FAIL_LIMIT = '3';
  let flagged = false;
  for (let i=0;i<5;i++) {
    const r = validateBodyAgainst(schema, { }, 'create');
    if (!r.ok && r.meta && r.meta.rateLimited) flagged = true;
  }
  expect(flagged).toBe(true);
  delete process.env.LOCUS_VALIDATION_FAIL_LIMIT;
});
