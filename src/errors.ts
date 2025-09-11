import { incSuggestions } from './metrics';
export type LocusErrorCode =
  //
  'lex_error' | 'parse_error' | 'merge_error' | 'validation_error';

// Structured diagnostic machine codes (Phase 1 initial set)
export const DiagnosticCode = {
  PARSE_UNEXPECTED_TOKEN: 'PARSE_UNEXPECTED_TOKEN',
  PARSE_MISSING_TOKEN: 'PARSE_MISSING_TOKEN',
  PARSE_UNKNOWN_KEYWORD: 'PARSE_UNKNOWN_KEYWORD',
  VALIDATION_UNKNOWN_ENTITY: 'VALIDATION_UNKNOWN_ENTITY',
  VALIDATION_DUP_FIELD: 'VALIDATION_DUP_FIELD',
  RELATION_INVALID_ON_DELETE: 'RELATION_INVALID_ON_DELETE',
  TYPE_OPTIONAL_LIST: 'TYPE_OPTIONAL_LIST',
  TYPE_INCOMPATIBLE_OPTIONAL_NULLABLE: 'TYPE_INCOMPATIBLE_OPTIONAL_NULLABLE'
} as const;
export type DiagnosticCodeKey = keyof typeof DiagnosticCode;

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  kind: 'parse' | 'lex' | 'merge' | 'validation' | 'general';
  code: string; // e.g. PARSE_UNEXPECTED_TOKEN
  message: string;
  filePath?: string;
  line?: number;
  column?: number;
  length?: number;
  severity: DiagnosticSeverity;
  related?: Array<{ message: string; filePath?: string; line?: number; column?: number }>;
}

export interface LocusErrorOptions {
  code: LocusErrorCode;
  message: string;
  filePath?: string;
  line?: number;
  column?: number;
  length?: number;
  cause?: unknown;
  suggestions?: string[];
  severity?: DiagnosticSeverity;
}

export class LocusError extends Error {
  public code: LocusErrorCode;
  public filePath?: string;
  public line?: number;
  public column?: number;
  public length?: number;
  public cause?: unknown;
  public suggestions?: string[];
  public severity: DiagnosticSeverity;

  constructor(opts: LocusErrorOptions) {
    super(opts.message);
    this.name = 'LocusError';
    this.code = opts.code;
    this.filePath = opts.filePath;
    this.line = opts.line;
    this.column = opts.column;
    this.length = opts.length;
    this.cause = opts.cause;
  this.suggestions = opts.suggestions;
  this.severity = opts.severity || 'error';
    (Error as any).captureStackTrace?.(this, LocusError);
  }
}

// Phase 1: Error code catalog (stable identifiers → human description)
export const ErrorCatalog: Record<string, string> = {
  PARSE_ERROR: 'General parse failure while converting source to AST',
  LEX_ERROR: 'Lexer failure tokenizing source',
  MERGE_ERROR: 'AST merging failure',
  VALIDATION_ERROR: 'Semantic validation failure',
};

// Lightweight keyword suggestion (edit distance <=2)
const SUGGEST_KEYWORDS = ['workflow','database','entity','page','component','store','state','action','steps','branch','else','elseif','forEach','in','guard','design_system','colors','spacing','radii','shadows','weights'];
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length; const dp = Array.from({length:m+1},()=>Array(n+1).fill(0));
  for (let i=0;i<=m;i++) dp[i][0]=i; for (let j=0;j<=n;j++) dp[0][j]=j;
  for (let i=1;i<=m;i++) for (let j=1;j<=n;j++) {
    const cost = a[i-1] === b[j-1] ? 0 : 1;
    dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
  }
  return dp[m][n];
}
function extractOffendingIdentifier(msg: string): string | undefined {
  const m = /found --> '([^']+)' <--/.exec(msg) || /Unexpected token:?\s+([^\s]+)/i.exec(msg) || /found:\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(msg);
  return m?.[1];
}
function computeSuggestions(msg: string): string[] | undefined {
  const tok = extractOffendingIdentifier(msg);
  const suggestions: string[] = [];
  if (tok) {
    const ranked = SUGGEST_KEYWORDS.map(k => [k, levenshtein(tok, k)] as const).sort((a,b)=>a[1]-b[1]);
    suggestions.push(...ranked.filter(r => r[1] <= 2).slice(0,3).map(r=>r[0]));
  }
  // Heuristics for common multi-token mistakes
  if (/else\s+if/.test(msg)) suggestions.push('elseif');
  if (/for\s+each/i.test(msg)) suggestions.push('forEach');
  if (/on\s+delete/i.test(msg)) suggestions.push('on_delete');
  const dedup = Array.from(new Set(suggestions));
  return dedup.length ? dedup : undefined;
}

export function errorToDiagnostic(e: LocusError): Diagnostic {
  const mapKind: Record<LocusErrorCode, Diagnostic['kind']> = {
    lex_error: 'lex',
    parse_error: 'parse',
    merge_error: 'merge',
    validation_error: 'validation'
  };
  const kind = mapKind[e.code] || 'general';
  const codeMap: Record<LocusErrorCode, string> = {
    lex_error: 'LEX_ERROR',
    parse_error: 'PARSE_ERROR',
    merge_error: 'MERGE_ERROR',
    validation_error: 'VALIDATION_ERROR'
  };
  // Keep suggestions length-based highlight for parse errors
  return {
    kind,
    code: codeMap[e.code] || 'UNKNOWN',
    message: e.message,
    filePath: e.filePath,
    line: e.line,
    column: e.column,
    length: e.length,
  severity: (e as any).severity || 'error'
  };
}

export function diagnosticsToJson(diags: Diagnostic[]): string {
  return JSON.stringify(diags.map(d => ({
    kind: d.kind,
    code: d.code,
    message: d.message,
    filePath: d.filePath,
    line: d.line,
    column: d.column,
    length: d.length,
    severity: d.severity,
    related: d.related
  })));
}

export class BuildError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'BuildError';
  }
}

export class GeneratorError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'GeneratorError';
  }
}

/** Validation Error */
export class VError extends LocusError {
  constructor(message: string, filePath?: string, line?: number, col?: number, length?: number) {
    super({ code: 'validation_error', message, filePath, line, column: col, length });
  }
}

/** Parser Error */
export class PError extends LocusError {
  constructor(message: string, filePath?: string, line?: number, col?: number, length?: number) {
  super({ code: 'parse_error', message, filePath, line, column: col, length, suggestions: computeSuggestions(message) });
    if (this.suggestions && this.suggestions.length) {
      incSuggestions(this.suggestions.length);
    }
  }
}
