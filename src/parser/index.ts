import { LocusFileAST } from '../ast';
import { LocusLexer } from './tokens';
import { DatabaseCstParser } from './databaseParser';
import { buildDatabaseAst } from './astBuilder';

export class LocusParserError extends Error {}

export function parseLocus(source: string, filePath?: string): LocusFileAST {
  const lexResult = LocusLexer.tokenize(source);
  if (lexResult.errors.length) {
    throw new LocusParserError('Lexing errors: ' + lexResult.errors.map(e => e.message).join('; '));
  }

  const parser = new DatabaseCstParser();
  parser.input = lexResult.tokens;
  const cst = parser.file();

  if (parser.errors.length) {
    throw new LocusParserError('Parsing errors: ' + parser.errors.map(e => e.message).join('; '));
  }

  return buildDatabaseAst(cst, source, filePath);
}
