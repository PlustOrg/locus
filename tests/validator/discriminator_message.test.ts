import { validateBodyAgainst } from '../../src/runtime/validateRuntime';

const schemaSingle = { entity: 'Poly', fields: [ { name: 'kind', type: 'string', optional: false, discriminator: true, enum: ['A','B'] } ] } as any;
const schemaMulti = { entity: 'BadPoly', fields: [ { name: 'k1', type: 'string', optional: false, discriminator: true }, { name: 'k2', type: 'string', optional: false, discriminator: true } ] } as any;
const schemaMsg = { entity: 'Msg', fields: [ { name: 'color', type: 'string', optional: false, enum: ['red'], message: 'Color must be red' } ] } as any;

test('single discriminator requires value', () => {
  const r = validateBodyAgainst(schemaSingle, {}, 'create');
  expect(r.ok).toBe(false);
  expect(r.errors![0].code).toBe('required');
});

test('multiple discriminators conflict', () => {
  const r = validateBodyAgainst(schemaMulti, { k1: 'x', k2: 'y' }, 'create');
  expect(r.ok).toBe(false);
  expect(r.errors!.some(e => e.code === 'discriminator_conflict')).toBe(true);
});

test('message override for enum', () => {
  const r = validateBodyAgainst(schemaMsg, { color: 'blue' }, 'create');
  expect(r.ok).toBe(false);
  expect(r.errors!.some(e => e.message === 'Color must be red')).toBe(true);
});
