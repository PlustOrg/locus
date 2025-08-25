import { DatabaseCstParser } from '../../src/parser/databaseParser';
import { LocusLexer } from '../../src/parser/tokens';
import { buildDatabaseAst } from '../../src/parser/astBuilder';
import { buildAstModular } from '../../src/parser/modularAstBuilder';

function parseToCst(src: string) {
  const lex = LocusLexer.tokenize(src);
  const p = new DatabaseCstParser();
  p.input = lex.tokens;
  const cst = p.file();
  if (p.errors.length) throw new Error(p.errors[0].message);
  return cst;
}

describe('Modular builder parity', () => {
  const sample = `database { entity User { id: Integer name: String createdAt: DateTime } }\npage Home { ui { <Div>Hello</Div> } }`;
  test('databases & pages parity', () => {
    const cst = parseToCst(sample);
    const legacy = buildDatabaseAst(cst, sample, 'file.locus');
    const mod = buildAstModular(cst, sample, 'file.locus');
    expect(JSON.stringify(mod.databases)).toEqual(JSON.stringify(legacy.databases));
    expect(JSON.stringify(mod.pages.map(p=>p.name))).toEqual(JSON.stringify(legacy.pages.map(p=>p.name)));
  });
});
