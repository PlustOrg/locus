import { buildDatabaseAst } from '../../src/parser/astBuilder';
import { LocusLexer } from '../../src/parser/tokens';
import { DatabaseCstParser } from '../../src/parser/databaseParser';

function parseComp(src: string) {
  const lex = LocusLexer.tokenize(src);
  const parser = new DatabaseCstParser();
  parser.input = lex.tokens;
  const cst = parser.file();
  const ast = buildDatabaseAst(cst as any, src, 'test.locus');
  return ast.components[0];
}

describe('Nested style:override braces', () => {
  test('captures @media block intact', () => {
    const comp = parseComp(`component Styled { ui { <div/> } style:override { .a { color: red; } @media (max-width: 600px) { .a { color: blue; } } } }`);
    expect(comp.styleOverride).toContain('@media (max-width: 600px) {');
    expect(comp.styleOverride?.split('{').length).toBeGreaterThan(2);
  });
});
