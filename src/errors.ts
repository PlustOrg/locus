import { incSuggestions } from './metrics';
import { computeSuggestions } from './diagnostics/suggestions';
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
  quickFixes?: Array<{ title: string; replacement: string; range?: { line: number; column: number; length: number } }>;
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
  public quickFixes?: Array<{ title: string; replacement: string; range?: { line: number; column: number; length: number } }>;

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
    this.quickFixes = opts.quickFixes;
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

// Suggestion logic centralized (see diagnostics/suggestions.ts)

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
    if (this.suggestions) {
      const fixes: Array<{ title: string; replacement: string }> = [];
      if (this.suggestions.includes('elseif')) fixes.push({ title: "Replace 'else if' with 'elseif'", replacement: 'elseif' });
      if (this.suggestions.includes('on_delete')) fixes.push({ title: "Replace 'on delete' with 'on_delete'", replacement: 'on_delete' });
      if (this.suggestions.includes('forEach')) fixes.push({ title: "Replace 'for each' with 'forEach'", replacement: 'forEach' });
      if (fixes.length) (this as any).fixes = fixes;
    }
    if (this.suggestions && this.suggestions.length) {
      incSuggestions(this.suggestions.length);
    }
  }
}

// Diagnostic filtering helpers
export interface DiagnosticFilterOptions {
  minSeverity?: DiagnosticSeverity; // threshold
  suppressCodes?: string[];
  suppressMessageRegex?: RegExp;
}
function _severityRank(s: DiagnosticSeverity): number { return s === 'error' ? 3 : s === 'warning' ? 2 : 1; }
export function filterDiagnostics(diags: Diagnostic[], opts: DiagnosticFilterOptions): Diagnostic[] {
  const minRank = opts.minSeverity ? _severityRank(opts.minSeverity) : 1;
  return diags.filter(d => {
    if (_severityRank(d.severity) < minRank) return false;
    if (opts.suppressCodes && opts.suppressCodes.includes(d.code)) return false;
    if (opts.suppressMessageRegex && opts.suppressMessageRegex.test(d.message)) return false;
    return true;
  });
}
