import { formatLocus } from '../../src/formatter/format';

const messy = `database   {   entity   User {  id: Integer   name: String   } }`;

test('canonical formatter produces stable output', () => {
  const out = formatLocus(messy);
  expect(out).toBe(`database {\n  entity User {\n    id: Integer\n    name: String\n  }\n}\n`);
  // idempotent
  expect(formatLocus(out)).toBe(out);
});
