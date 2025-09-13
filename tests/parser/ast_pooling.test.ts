import { parseLocus } from '../../src/parser';
import { __getAstAllocCount } from '../../src/parser/builders/databaseBuilder';

test('AST node pooling reduces additional allocations on reparse', () => {
  process.env.LOCUS_AST_POOL='1';
  const src = 'database { entity A { id: Integer name: String } }';
  parseLocus(src,'a.locus');
  const first = __getAstAllocCount();
  parseLocus(src,'a.locus');
  const second = __getAstAllocCount();
  expect(second - first).toBeLessThanOrEqual(1); // caching + pooling => near zero growth
  delete process.env.LOCUS_AST_POOL;
});
