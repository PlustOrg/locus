import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { createContext, builtinSteps } from '../../src/generator/pipeline';

function build(unified:any) {
  const ctx = createContext(unified, {});
  for (const step of builtinSteps) step.run(ctx as any);
  return ctx;
}

test('dead code elimination removes unused component when enabled', () => {
  process.env.LOCUS_DEAD_CODE='1';
  const src = `component Unused { ui { <div /> } } component Used { ui { <div /> } } page Home { ui { <Used /> } }`;
  const ast = mergeAsts([parseLocus(src,'f.locus')]);
  const unified:any = { components: ast.components || [], pages: ast.pages || [], designSystem: {}, database: { entities: [] } };
  const ctx = build(unified);
  expect(Object.keys(ctx.files).some(f=>f.includes('Unused.tsx'))).toBe(false);
  expect(Object.keys(ctx.files).some(f=>f.includes('Used.tsx'))).toBe(true);
  expect(ctx.warnings.some(w=>/dead_code: component Unused/.test(w))).toBe(true);
  delete process.env.LOCUS_DEAD_CODE;
});
