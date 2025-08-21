export type LocusErrorCode =
  //
  'lex_error' | 'parse_error' | 'merge_error' | 'validation_error';

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
