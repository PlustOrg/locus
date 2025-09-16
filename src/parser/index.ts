import { LocusFileAST } from '../ast';
import { PError } from '../errors';
import { LocusLexer } from './tokens';
import crypto from 'crypto';
import { LocusCstParser } from './locusCstParser';
import { buildAstModular } from './modularAstBuilder';
import { extractTypeAliases, applyTypeAliases } from './typeAliases';
// style_override handled directly in grammar. Legacy style:override removed.
let __parseCount = 0;
const __hashCache = new Map<string,string>();
const __astCache = new Map<string,LocusFileAST>();
export function __getParseCount(){ return __parseCount; }
export function __resetParseCount(){ __parseCount = 0; __hashCache.clear(); __astCache.clear(); }
function hashContent(s: string){ return crypto.createHash('sha1').update(s).digest('hex'); }

export function parseLocus(source: string, filePath?: string): LocusFileAST {
  // quick lexical pre-check for disallowed legacy constructs
  if (/\bon_load\b/.test(source)) {
    // approximate location: find first occurrence
    const idx = source.indexOf('on_load');
    const pre = source.slice(0, idx);
    const line = pre.split(/\n/).length;
    const col = idx - pre.lastIndexOf('\n');
    const err = new PError("Use 'on load' instead of legacy 'on_load'", filePath, line, col, 'on_load'.length);
    (err as any).suggestions = (err as any).suggestions ? [...(err as any).suggestions, 'on load'] : ['on load'];
    throw err;
  }
  // Extract and strip simple type alias lines so core grammar (database etc.) is unaffected
  const aliasLines: string[] = [];
  const originalSource = source;
  const aliasMap = extractTypeAliases(originalSource);
  source = source.replace(/^type\s+[A-Z][A-Za-z0-9_]*\s*=\s*[A-Z][A-Za-z0-9_]*\s*$/gm, (m) => { aliasLines.push(m); return ''; });
  const normalized = source.replace(/!/g, ' ');
  if (filePath) {
    const h = hashContent(normalized);
    const prev = __hashCache.get(filePath);
    if (prev && prev === h) {
      const cached = __astCache.get(filePath);
      if (cached) return cached;
    }
    __hashCache.set(filePath, h);
  }
  __parseCount++;
  const lexResult = LocusLexer.tokenize(normalized.replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, (id) => aliasMap[id] ? aliasMap[id] : id));
  if (lexResult.errors.length) {
    const err = lexResult.errors[0];
  throw new PError(err.message, filePath, err.line, err.column, (err as any).length ?? 1);
  }

  const parser = new LocusCstParser();
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
  try {
    if (Object.keys(aliasMap).length) applyTypeAliases(ast as any, aliasMap);
  } catch {/* ignore alias failures */}
  // Provide unified top-level convenience arrays for mixed content files.
  try {
    const dbs = (ast as any).databases || [];
    const hasMixed = dbs.length > 1 || ((ast as any).pages?.length || (ast as any).components?.length || (ast as any).workflows?.length);
    if (hasMixed || process.env.LOCUS_EXPOSE_FLAT_ENTITIES === '1') {
      const entities: any[] = [];
      for (const db of dbs) if (Array.isArray(db.entities)) entities.push(...db.entities);
      if (entities.length) (ast as any).entities = entities;
    }
  } catch {/* ignore */}
  if (filePath) __astCache.set(filePath as string, ast);
  return ast;
}

// Experimental parallel parsing scaffold (not yet active for real, placeholder)
export async function parseFilesParallel(files: Array<{ path: string; content: string }>): Promise<any[]> {
  const enabled = process.env.LOCUS_PARALLEL_PARSE === '1';
  if (!enabled) return files.map(f => parseLocus(f.content, f.path));
  // naive concurrency via Promise.all (worker threads could be added later)
  return Promise.all(files.map(f => Promise.resolve().then(()=> parseLocus(f.content, f.path))));
}
