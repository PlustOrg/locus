import { IToken } from 'chevrotain';
import { LocusLexer } from './tokens';
import type { ExprNode } from '../ast';

interface TokenStream { idx: number; tokens: IToken[] }
function peek(ts: TokenStream): IToken | undefined { return ts.tokens[ts.idx]; }
function consume(ts: TokenStream): IToken { const t = ts.tokens[ts.idx]; if (!t) throw new Error('Unexpected EOF'); ts.idx++; return t; }

const PRECEDENCE: Record<string, number> = { '||':1, '&&':2, '==':3, '!=':3, '<':4, '>':4, '+':5, '-':5, '*':6, '/':6 };

export function parseExpression(text: string): ExprNode | undefined {
  if (!text) return undefined;
  const cached = exprCache.get(text);
  if (cached) return cached;
  const lex = LocusLexer.tokenize(text);
  const tokens = lex.tokens.filter(t => t.tokenType.name !== 'WhiteSpace');
  const ts: TokenStream = { idx:0, tokens };
  if (!tokens.length) return undefined;
  const ast = parseExpr(ts, 0);
  exprCache.set(text, ast);
  return ast;
}

// Simple in-memory cache (expression text -> AST). Assumes AST immutable downstream.
const exprCache = new Map<string, ExprNode>();
export function _clearExprCache(){ exprCache.clear(); }

function parseExpr(ts: TokenStream, minPrec: number): ExprNode {
  let left = parsePrimary(ts);
  for (;;) {
    const t = peek(ts);
    if (!t) break;
    const op = mapOp(t);
    if (!op) break;
    const prec = PRECEDENCE[op];
    if (prec < minPrec) break;
    consume(ts);
    const right = parseExpr(ts, prec + 1);
    left = { kind: 'bin', op: op as any, left, right } as ExprNode;
  }
  return left;
}

function mapOp(t: IToken): string | undefined {
  switch (t.tokenType.name) {
    case 'OrOr': return '||';
    case 'AndAnd': return '&&';
    case 'EqEq': return '==';
    case 'NotEq': return '!=';
    case 'PlusTok': return '+';
  case 'HyphenTok': return '-';
    case 'StarTok': return '*';
    case 'SlashTok': return '/';
  case 'Less': return '<';
  case 'Greater': return '>';
    default: return undefined;
  }
}

function parsePrimary(ts: TokenStream): ExprNode {
  const t = peek(ts);
  if (!t) throw new Error('Unexpected EOF');
  switch (t.tokenType.name) {
    case 'Identifier': {
      consume(ts);
      let node: ExprNode = { kind: 'id', name: t.image } as any;
      // member access chain
      while (peek(ts)?.tokenType.name === 'DotTok') {
        consume(ts); const p = consume(ts); node = { kind: 'member', object: node, property: p.image } as any;
      }
      // call expression (after identifier or member chain)
      if (peek(ts)?.tokenType.name === 'LParen') {
        consume(ts); // (
        const args: ExprNode[] = [];
        if (peek(ts)?.tokenType.name !== 'RParen') {
          for (;;) {
            args.push(parseExpr(ts, 0));
            if (peek(ts)?.tokenType.name === 'Comma') { consume(ts); continue; }
            break;
          }
        }
        if (peek(ts)?.tokenType.name !== 'RParen') throw new Error('Expected ) after arguments');
        consume(ts); // )
        node = { kind: 'call', callee: node, args } as any;
      }
      return node;
    }
    case 'NumberLiteral': consume(ts); return { kind: 'lit', value: Number(t.image) } as any;
    case 'StringLiteral': consume(ts); return { kind: 'lit', value: t.image.slice(1,-1) } as any;
    case 'Bang': consume(ts); return { kind: 'unary', op: '!', expr: parsePrimary(ts) } as any;
    case 'HyphenTok': consume(ts); return { kind: 'unary', op: '-', expr: parsePrimary(ts) } as any;
    case 'LParen': {
      consume(ts); const expr = parseExpr(ts,0); if (peek(ts)?.tokenType.name !== 'RParen') throw new Error('Expected )'); consume(ts); return { kind:'paren', expr } as any;
    }
    default:
      throw new Error('Unexpected token: ' + t.image);
  }
}
