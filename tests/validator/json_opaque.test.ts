import { validateBodyAgainst } from '../../src/runtime/validateRuntime';

const jsonSchema = { entity: 'Doc', fields: [ { name: 'payload', type: 'json', optional: false, json: true } ] } as any;
const opaqueSchema = { entity: 'Bin', fields: [ { name: 'blob', type: 'string', optional: false, opaque: true } ] } as any;

test('json field accepts arbitrary structure', () => {
  const res = validateBodyAgainst(jsonSchema, { payload: { a: [1,2,{x:true}] } }, 'create');
  expect(res.ok).toBe(true);
});

test('opaque field bypasses string size & pattern', () => {
  const huge = 'x'.repeat(20000); // larger than MAX_FIELD_STRING_LENGTH
  const res = validateBodyAgainst(opaqueSchema, { blob: huge }, 'create');
  expect(res.ok).toBe(true);
});
