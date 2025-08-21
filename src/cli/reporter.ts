import { LocusError } from '../errors';
import chalk from 'chalk';
import boxen from 'boxen';

export function reportError(e: LocusError, fileMap: Map<string, string>) {
  let output = '';
  const heading = e.code === 'parse_error'
    ? 'Parse Error'
    : e.code === 'lex_error'
    ? 'Syntax Error'
    : e.code === 'validation_error'
    ? 'Validation Error'
    : 'Error';
  const rawMsg = (e as any).message ? String((e as any).message) : String(e);
  const friendlyMsg = simplifyChevrotainMessage(rawMsg);
  output += chalk.red.bold(`${heading}: `) + friendlyMsg + '\n';
  if (e.filePath) {
    output += chalk.cyan(e.filePath);
    if (e.line) {
      output += `:${e.line}`;
      if (e.column) {
        output += `:${e.column}`;
      }
    }
    output += '\n';
  }

  if (e.filePath && e.line) {
    const content = fileMap.get(e.filePath);
    if (content) {
      const lines = content.split('\n');
      const line = lines[e.line - 1];
      if (line) {
        output += '\n';
        const gutterW = String(e.line + 1).length;
        const prev = lines[e.line - 2] || '';
        const next = lines[e.line] || '';
        output += chalk.dim(`${String(e.line - 1).padStart(gutterW)} | `) + chalk.dim(prev) + '\n';
        output += chalk.white(`${String(e.line).padStart(gutterW)} | `) + line + '\n';
        if (e.column) {
          const startCol = e.column;
          const len = Math.max(1, e.length ?? 1);
          const markerPad = ' '.repeat(gutterW + 3 + startCol - 1);
          const marker = chalk.red('^') + (len > 1 ? chalk.red('~'.repeat(Math.max(0, len - 1))) : '');
          output += markerPad + marker + '\n';
        }
        output += chalk.dim(`${String(e.line + 1).padStart(gutterW)} | `) + chalk.dim(next) + '\n';
      }
    }
  }

  // add footer hint
  if ((e as any).code) {
    output += '\n' + chalk.dim(`Code: ${e.code}`) + '\n';
  }
  process.stderr.write(boxen(output, { padding: 1, margin: 1, borderColor: 'red' }) + '\n');
}

function simplifyChevrotainMessage(msg: string): string {
  // Example: "Expecting token of type --> LCurly <-- but found --> '"light"' <--"
  const m = /Expecting token of type -->\s*(\w+)\s*<--\s*but found -->\s*([^<]+)\s*<--/.exec(msg);
  if (m) {
    const expected = humanizeToken(m[1]);
    const found = m[2].trim();
    return `Expected ${expected} but found ${found}`;
  }
  return msg;
}

function humanizeToken(tok: string): string {
  const map: Record<string, string> = {
    LCurly: "'{'",
    RCurly: "'}'",
    LParen: "'('",
    RParen: "')'",
    Comma: "','",
    Colon: "':'",
    Identifier: 'an identifier',
    StringLiteral: 'a string',
    NumberLiteral: 'a number',
  };
  return map[tok] || tok;
}
