import { parseLocus } from '../../src/parser';

describe('Parser recovery disabled', () => {
  test('stops at first syntax error', () => {
    const src = 'database { entity User { name String bad_field: Integer } entity X { }';
  try { parseLocus(src,'t'); } catch(e:any) { expect(e.message).toMatch(/Expecting: one of/); return; }
    throw new Error('Expected parse error');
  });
});
