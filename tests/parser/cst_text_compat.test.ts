import { sliceFromCst, extractTextSpan } from '../../src/parser/cstText';
import { LocusCstParser } from '../../src/parser/databaseParser';
import { LocusLexer } from '../../src/parser/tokens';

test('sliceFromCst and extractTextSpan produce non-empty text for entityDecl', () => {
  const src = `database { entity User { id: String } }`;
  const lex = LocusLexer.tokenize(src);
  const parser = new LocusCstParser();
  parser.input = lex.tokens;
  const cst = parser.file();
  const top = (cst as any).children.topLevel[0];
  const dbBlock = (top.children.databaseBlock[0]);
  const entityDecl = dbBlock.children.entityDecl[0];
  const a = sliceFromCst(entityDecl, src);
  const b = extractTextSpan(entityDecl, src);
  expect(a).toContain('entity User');
  expect(b).toContain('entity User');
  // Both strategies should at least include field name
  expect(a).toMatch(/id: String/);
  expect(b).toMatch(/id: String/);
});
