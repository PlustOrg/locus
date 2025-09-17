import { CstParser } from 'chevrotain';
import { StyleKw, OverrideKw, StyleOverride, LCurly, RCurly, Colon } from '../tokens';

// Style related grammar rules extracted from feature grammar.
export function defineStyleGrammar(self: CstParser) {
  const s: any = self;
  s.styleOverrideBlock = s.RULE('styleOverrideBlock', () => {
    s.CONSUME(StyleOverride);
    s.CONSUME(LCurly);
    s.OPTION(() => s.SUBRULE(s.rawContent));
    s.CONSUME(RCurly);
  });
  s.styleBlock = s.RULE('styleBlock', () => {
    s.CONSUME(StyleKw);
    s.CONSUME(Colon);
    s.CONSUME(OverrideKw);
    s.CONSUME(LCurly);
    s.OPTION(() => s.SUBRULE(s.rawContent));
    s.CONSUME(RCurly);
  });
}
