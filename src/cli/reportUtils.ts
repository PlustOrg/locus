// Utility functions for error reporting and formatting
import chalk from 'chalk';

/**
 * Simplify Chevrotain error messages for user-friendly output.
 */
export function simplifyChevrotainMessage(msg: string): string {
  const m = /Expecting token of type -->\s*(\w+)\s*<--\s*but found -->\s*([^<]+)\s*<--/.exec(msg);
  if (m) {
    const expected = humanizeToken(m[1]);
    const found = m[2].trim();
    return `Expected ${expected} but found ${found}`;
  }
  return msg;
}

/**
 * Human-readable token names for error messages.
 */
export function humanizeToken(tok: string): string {
  const map: Record<string, string> = {
    LCurly: "'{'",
    RCurly: "'}'",
    LParen: "'('",
    RParen: "')'",
    Comma: ",",
  Colon: "':'",
    Equals: "=",
    LBracketTok: "'['",
    RBracketTok: "]",
    Identifier: 'an identifier',
    StringLiteral: 'a string',
    NumberLiteral: 'a number',
    Question: "'?'",
    Less: "'<'",
    Greater: "'>'",
    SlashTok: "'/'",
    DotTok: ".",
    PlusTok: "+",
    SingleQuoteTok: "'\''",
  };
  return map[tok] || tok;
}

/**
 * Colorize friendly error messages for CLI output.
 */
export function colorizeFriendlyMessage(msg: string): string {
  // For parse errors, highlight expected in yellow, found in cyan
  const m = /^Expected (.+) but found (.+)$/i.exec(msg);
  if (m) {
    const exp = chalk.yellow(m[1]);
    const found = chalk.cyan(m[2]);
    return `Expected ${exp} but found ${found}`;
  }
  return msg;
}