import { CstParser } from 'chevrotain';
import {
  Concurrency, Retry, LCurly, RCurly, Comma, Limit, Colon, NumberLiteral, Group, Identifier, MaxKw, HyphenTok,
  BackoffKw, FactorKw, Delay, Duration
} from '../tokens';

export function defineWorkflowControlGrammar(self: CstParser) {
  const s: any = self;
  s.concurrencyBlock = s.RULE('concurrencyBlock', () => { s.CONSUME(Concurrency); s.CONSUME(LCurly); s.AT_LEAST_ONE(() => { s.SUBRULE(s.concurrencyEntry); s.OPTION(() => s.CONSUME(Comma)); }); s.CONSUME(RCurly); });
  s.concurrencyEntry = s.RULE('concurrencyEntry', () => { s.OR([{ ALT: () => { s.CONSUME(Limit); s.CONSUME(Colon); s.CONSUME(NumberLiteral); } }, { ALT: () => { s.CONSUME(Group); s.CONSUME1(Colon); s.CONSUME(Identifier); } }]); });
  s.retryBlock = s.RULE('retryBlock', () => { s.CONSUME(Retry); s.CONSUME(LCurly); s.MANY(() => { s.SUBRULE(s.retryEntry); s.OPTION(() => s.CONSUME(Comma)); }); s.CONSUME(RCurly); });
  s.retryEntry = s.RULE('retryEntry', () => { s.OR([
    { ALT: () => { s.CONSUME(MaxKw); s.CONSUME3(Colon); s.OPTION(() => s.CONSUME(HyphenTok)); s.CONSUME(NumberLiteral); } },
    { ALT: () => { s.CONSUME(BackoffKw); s.CONSUME4(Colon); s.CONSUME4(Identifier); } },
    { ALT: () => { s.CONSUME(FactorKw); s.CONSUME5(Colon); s.OPTION1(() => s.CONSUME1(HyphenTok)); s.CONSUME1(NumberLiteral); } },
    { ALT: () => { s.CONSUME(Delay); s.CONSUME6(Colon); s.OR2([{ ALT: () => s.CONSUME(Duration) }, { ALT: () => { s.OPTION2(() => s.CONSUME2(HyphenTok)); s.CONSUME2(NumberLiteral); } }]); } },
    { ALT: () => { s.CONSUME5(Identifier); s.CONSUME7(Colon); s.OR3([{ ALT: () => { s.OPTION3(() => s.CONSUME3(HyphenTok)); s.CONSUME3(NumberLiteral); } }, { ALT: () => s.CONSUME6(Identifier) }]); } }
  ]); });
}
