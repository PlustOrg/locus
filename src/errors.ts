export type LocusErrorCode =
  //
  'lex_error' | 'parse_error' | 'merge_error' | 'validation_error';

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
}

export class LocusError extends Error {
  public code: LocusErrorCode;
  public filePath?: string;
  public line?: number;
  public column?: number;
  public length?: number;
  public cause?: unknown;

  constructor(opts: LocusErrorOptions) {
    super(opts.message);
    this.name = 'LocusError';
    this.code = opts.code;
    this.filePath = opts.filePath;
    this.line = opts.line;
    this.column = opts.column;
    this.length = opts.length;
    this.cause = opts.cause;
    (Error as any).captureStackTrace?.(this, LocusError);
  }
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
  return {
    kind,
    code: codeMap[e.code] || 'UNKNOWN',
    message: e.message,
    filePath: e.filePath,
    line: e.line,
    column: e.column,
    length: e.length,
    severity: 'error'
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
  constructor(message: string, filePath?: string, line?: number, col?: number) {
    super({ code: 'validation_error', message, filePath, line, column: col });
  }
}

/** Parser Error */
export class PError extends LocusError {
  constructor(message: string, filePath?: string, line?: number, col?: number, length?: number) {
    super({ code: 'parse_error', message, filePath, line, column: col, length });
  }
}
