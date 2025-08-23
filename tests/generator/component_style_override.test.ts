import { buildDatabaseAst } from '../../src/parser/astBuilder';
import { LocusLexer } from '../../src/parser/tokens';
import { DatabaseCstParser } from '../../src/parser/databaseParser';
import { buildOutputArtifacts } from '../../src/generator/outputs';

function parse(src: string) {
  const lex = LocusLexer.tokenize(src);
  const parser = new DatabaseCstParser();
  parser.input = lex.tokens;
  const cst = parser.file();
  return buildDatabaseAst(cst as any, src, 'test.locus');
}

describe('style:override support', () => {
  test('captures style block without extra or missing braces', () => {
    const src = `component SpecialButton {\n  ui { <button class=\"special-button\">Hi</button> }\n  style:override {\n    .special-button { color: red; }\n    .special-button:hover { color: blue; }\n  }\n}`;
    const ast = parse(src);
  const comp: any = ast.components.find((c: any) => c.name === 'SpecialButton');
  expect(comp?.styleOverride).toContain('.special-button {');
  expect(comp?.styleOverride).toContain('.special-button:hover {');
  expect(comp?.styleOverride.trim().endsWith('}')).toBe(true); // last rule closed
  });

  test('emits css file with correct header and imports it', () => {
    const src = `component Fancy { ui { <div class=\"fancy\"/> } style:override { .fancy { padding: 4px; } } }`;
    const ast = parse(src);
    const merged: any = { database: { entities: [] }, pages: [], components: ast.components };
    const { files } = buildOutputArtifacts(merged, { srcDir: '.' });
    expect(Object.keys(files)).toContain('react/components/Fancy.css');
    const css = files['react/components/Fancy.css'];
    expect(css.startsWith('/* AUTO-GENERATED')).toBe(true);
    const tsx = files['react/components/Fancy.tsx'];
    expect(tsx).toContain("import './Fancy.css'");
  });
});
