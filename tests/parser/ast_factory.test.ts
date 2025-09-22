import { createPrimitiveFieldType, createField, createEntity } from '../../src/ast/factory';

test('primitive field factory assigns code', () => {
  const ft = createPrimitiveFieldType('String');
  expect(ft.code).toBeDefined();
  const f = createField('name', ft, []);
  const e = createEntity('User', [f], []);
  expect(e.fields[0].type).toBe(ft);
});
