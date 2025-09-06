import { validateBodyAgainst } from '../../src/runtime/validateRuntime';

const schema = { entity: 'WithDefault', fields: [ { name: 'flag', type: 'string', optional: false, defaultValue: 'ON' } ] } as any;

test('applies default value when missing on create', () => {
  const body: any = {};
  const res = validateBodyAgainst(schema, body, 'create');
  expect(res.ok).toBe(true);
  expect(body.flag).toBe('ON');
});

test('does not overwrite provided value', () => {
  const body: any = { flag: 'OFF' };
  const res = validateBodyAgainst(schema, body, 'create');
  expect(res.ok).toBe(true);
  expect(body.flag).toBe('OFF');
});
