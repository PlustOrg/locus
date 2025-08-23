import { LocusFileAST } from '../ast';
import { PError } from '../errors';
import { LocusLexer } from './tokens';
import { DatabaseCstParser } from './databaseParser';
import { buildDatabaseAst } from './astBuilder';

export function parseLocus(source: string, filePath?: string): LocusFileAST {
  // Strip style:override blocks (balanced braces) from lexed source so grammar ignores CSS internals.
  let lexSource = source;
  const marker = 'style:override';
  let search = lexSource.indexOf(marker);
  while (search !== -1) {
    const braceStart = lexSource.indexOf('{', search + marker.length);
    if (braceStart === -1) break;
    let depth = 1;
    let i = braceStart + 1;
    while (i < lexSource.length && depth > 0) {
      const ch = lexSource[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      i++;
    }
    if (depth !== 0) break; // unbalanced; abort stripping further
    // Replace full block with minimal placeholder to keep structural braces predictable
    lexSource = lexSource.slice(0, search) + 'style:override {}' + lexSource.slice(i);
    search = lexSource.indexOf(marker, search + 'style:override {}'.length);
  }
  const lexResult = LocusLexer.tokenize(lexSource);
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

  return buildDatabaseAst(cst, source, filePath);
}
