import { parseLocus, __getParseCount, __resetParseCount } from '../../src/parser';

test('second parse of same content uses cache (no parse count increment)', () => {
  __resetParseCount();
  parseLocus('database { entity A { id: Integer } }','a.locus');
  const first = __getParseCount();
  parseLocus('database { entity A { id: Integer } }','a.locus');
  const second = __getParseCount();
  expect(second).toBe(first); // cache hit means count unchanged
});
