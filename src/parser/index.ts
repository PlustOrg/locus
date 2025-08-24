import { LocusFileAST } from '../ast';
import { PError } from '../errors';
import { LocusLexer } from './tokens';
import { DatabaseCstParser } from './databaseParser';
import { buildDatabaseAst } from './astBuilder';
import { attachComponentStyles } from './extractStyles';
// CSS style:override blocks treated as opaque post-parse; no preprocessing.

function detectUnterminatedStyleBlock(source: string): { offset: number } | null {
  const len = source.length;
  let i = 0;
  while (i < len) {
    const ch = source[i];
    // strings
    if (ch === '"' || ch === '\'') {
      const quote = ch; i++;
      while (i < len) { if (source[i] === '\\') { i += 2; continue; } if (source[i] === quote) { i++; break; } i++; }
      continue;
    }
    // block comment
    if (ch === '/' && source[i+1] === '*') {
      i += 2; while (i < len && !(source[i] === '*' && source[i+1] === '/')) i++; i += 2; continue;
    }
    // line comment
    if (ch === '/' && source[i+1] === '/') { i += 2; while (i < len && source[i] !== '\n') i++; continue; }
    // style:override detection
    if (ch === 's' && source.startsWith('style:override', i)) {
      const start = i;
      let j = i + 'style:override'.length;
      while (j < len && /\s/.test(source[j])) j++;
      if (source[j] !== '{') { i++; continue; }
      j++; // skip '{'
      let depth = 1;
      while (j < len && depth > 0) {
        const c = source[j];
        if (c === '"' || c === '\'') {
          const q = c; j++; while (j < len) { if (source[j] === '\\') { j += 2; continue; } if (source[j] === q) { j++; break; } j++; }
          continue;
        }
        if (c === '/' && source[j+1] === '*') { j += 2; while (j < len && !(source[j] === '*' && source[j+1] === '/')) j++; j += 2; continue; }
        if (c === '/' && source[j+1] === '/') { j += 2; while (j < len && source[j] !== '\n') j++; continue; }
        if (c === '{') depth++;
        else if (c === '}') depth--;
        j++;
      }
      if (depth !== 0) return { offset: start };
      i = j; continue;
    }
    i++;
  }
  return null;
}

function sanitizeStyleOverrideContent(source: string): string {
  let out = '';
  let i = 0;
  const len = source.length;
  while (i < len) {
    const idx = source.indexOf('style:override', i);
    if (idx === -1) { out += source.slice(i); break; }
    // copy prefix
    out += source.slice(i, idx);
    let j = idx + 'style:override'.length;
    while (j < len && /\s/.test(source[j])) j++;
    if (source[j] !== '{') { out += 'style:override'; i = idx + 'style:override'.length; continue; }
    // append literal up to '{'
    out += source.slice(idx, j + 1);
    j++; let depth = 1; const startContent = j;
    while (j < len && depth > 0) {
      const ch = source[j];
      if (ch === '"' || ch === '\'') { const q = ch; j++; while (j < len) { if (source[j] === '\\') { j += 2; continue; } if (source[j] === q) { j++; break; } j++; } continue; }
      if (ch === '/' && source[j+1] === '*') { j += 2; while (j < len && !(source[j] === '*' && source[j+1] === '/')) j++; j += 2; continue; }
      if (ch === '/' && source[j+1] === '/') { j += 2; while (j < len && source[j] !== '\n') j++; continue; }
      if (ch === '{') depth++; else if (ch === '}') depth--;
      j++;
    }
    const endContent = depth === 0 ? j - 1 : j;
    // replace inner content with single space preserving newlines count
    const inner = source.slice(startContent, endContent);
    const preserved = inner.replace(/[^\n]/g, ' ');
    out += preserved;
    if (depth === 0) { out += '}'; i = j; } else { i = j; }
  }
  return out;
}

export function parseLocus(source: string, filePath?: string): LocusFileAST {
  const unter = detectUnterminatedStyleBlock(source);
  if (unter) {
    const prefix = source.slice(0, unter.offset);
    const line = (prefix.match(/\n/g)?.length || 0) + 1;
    const col = unter.offset - prefix.lastIndexOf('\n');
    throw new PError('Unterminated style:override block', filePath, line, col, 'style:override'.length);
  }
  let sanitized = sanitizeStyleOverrideContent(source);
  // Allow exclamation marks inside UI text by neutralizing them for the lexer (kept in original source for AST slicing)
  sanitized = sanitized.replace(/!/g, ' ');
  const lexResult = LocusLexer.tokenize(sanitized);
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

  const ast = buildDatabaseAst(cst, source, filePath);
  attachComponentStyles(ast, source);
  return ast;
}
