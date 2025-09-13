import { parseLocus } from '../../src/parser';
import { __getEntityBuildCount } from '../../src/parser/builders/databaseBuilder';

test('entity CST cache prevents rebuild on identical parse', () => {
  process.env.LOCUS_CST_CACHE='1';
  const src = 'database { entity A { id: Integer name: String } }';
  parseLocus(src,'a.locus');
  const first = __getEntityBuildCount();
  parseLocus(src,'a.locus');
  const second = __getEntityBuildCount();
  expect(second).toBe(first); // no new builds
  delete process.env.LOCUS_CST_CACHE;
});
