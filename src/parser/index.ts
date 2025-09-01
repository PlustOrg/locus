import { LocusFileAST } from '../ast';
import { PError } from '../errors';
import { LocusLexer } from './tokens';
import { DatabaseCstParser } from './databaseParser';
import { buildAstModular } from './modularAstBuilder';
// style_override handled directly in grammar. Legacy style:override removed.


export function parseLocus(source: string, filePath?: string): LocusFileAST {
  const lexResult = LocusLexer.tokenize(source.replace(/!/g, ' '));
  if (lexResult.errors.length) {
    const err = lexResult.errors[0];
  throw new PError(err.message, filePath, err.line, err.column, (err as any).length ?? 1);
  }

  const parser = new DatabaseCstParser();
  parser.input = lexResult.tokens;
  const cst = parser.file();

  if (parser.errors.length) {
    const err = parser.errors[0];
    const tok = err.token;
    const length = (tok && tok.endOffset != null && tok.startOffset != null)
      ? tok.endOffset - tok.startOffset + 1
      : 1;
    throw new PError(err.message, filePath, tok.startLine, tok.startColumn, length);
  }

  const ast = buildAstModular(cst, source, filePath);
  return ast;
}
