import { parseLocus } from '../../src/parser';
import { attachComponentStyles } from '../../src/parser/extractStyles';

test('attachComponentStyles assigns last style block as styleOverride', () => {
  const src = `component Card { ui { <div/> } style_override { color: red; } style_override { color: blue; } }`;
  const ast = parseLocus(src, 'comp.locus');
  attachComponentStyles(ast, src);
  const comp: any = ast.components.find(c=>c.name==='Card');
  expect(comp.styleOverride).toMatch(/blue/);
  expect(comp.styleOverrides.length).toBe(2);
});
