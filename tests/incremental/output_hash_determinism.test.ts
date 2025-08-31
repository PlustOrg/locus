import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { runPipeline } from '../../src/generator/pipeline';

test('double build hash stable', () => {
  const src = `database { entity User { name: String @unique } }`;
  const ast = mergeAsts([parseLocus(src,'a.locus')]);
  const run1 = runPipeline(ast as any, { includeNext:false, includeTheme:false });
  const run2 = runPipeline(ast as any, { includeNext:false, includeTheme:false });
  expect((run1.meta as any).buildHash).toBe((run2.meta as any).buildHash);
});
