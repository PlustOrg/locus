import { parseLocus } from '../../src/parser';
import { attachComponentStyles } from '../../src/parser/extractStyles';
import { buildOutputArtifacts } from '../../src/generator/outputs';

const parse = (src: string) => parseLocus(src, 'test.locus');

describe('style_override support', () => {
  test('captures style_override block without extra or missing braces', () => {
    const src = `component SpecialButton {\n  ui { <button class=\"special-button\">Hi</button> }\n  style_override {\n    .special-button { color: red; }\n    .special-button:hover { color: blue; }\n  }\n}`;
    const ast = parse(src);
  const comp: any = ast.components.find((c: any) => c.name === 'SpecialButton');
  expect(comp?.styleOverride).toContain('.special-button {');
  expect(comp?.styleOverride).toContain('.special-button:hover {');
  expect(comp?.styleOverride.trim().endsWith('}')).toBe(true); // last rule closed
  });

  test('emits css file with correct header and imports it', () => {
    const src = `component Fancy { ui { <div class=\"fancy\"/> } style_override { .fancy { padding: 4px; } } }`;
    const ast = parse(src);
    const merged: any = { database: { entities: [] }, pages: [], components: ast.components };
    const { files } = buildOutputArtifacts(merged, { srcDir: '.' });
    expect(Object.keys(files)).toContain('react/components/Fancy.css');
    const css = files['react/components/Fancy.css'];
    expect(css.startsWith('/* AUTO-GENERATED')).toBe(true);
    const tsx = files['react/components/Fancy.tsx'];
    expect(tsx).toContain("import './Fancy.css'");
  });

  test('legacy style:override parses (deprecated)', () => {
    const legacy = `component L { ui { <div/> } style:override { .x { color: red; } } }`;
    const ast = parse(legacy);
    attachComponentStyles(ast, legacy);
    const comp: any = ast.components.find((c: any) => c.name === 'L');
    expect(comp?.styleOverride).toMatch(/color: red/);
  });
});
