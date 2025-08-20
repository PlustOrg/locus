import { LocusFileAST } from '../ast';
import { PError } from '../errors';
import { LocusLexer } from './tokens';
import { DatabaseCstParser } from './databaseParser';
import { buildDatabaseAst } from './astBuilder';

export function parseLocus(source: string, filePath?: string): LocusFileAST {
  const lexResult = LocusLexer.tokenize(source);
  if (lexResult.errors.length) {
    const err = lexResult.errors[0];
    throw new PError(err.message, filePath, err.line, err.column, err.length);
  }

  const parser = new DatabaseCstParser();
  parser.input = lexResult.tokens;
  const cst = parser.file();

  if (parser.errors.length) {
    const err = parser.errors[0];
    const tok = err.token;
    const length = tok.endOffset && tok.startOffset ? tok.endOffset - tok.startOffset + 1 : 1;
    throw new PError(err.message, filePath, tok.startLine, tok.startColumn, length);
  }

  return buildDatabaseAst(cst, source, filePath);
}
