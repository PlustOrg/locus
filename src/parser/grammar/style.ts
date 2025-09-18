import { CstParser } from 'chevrotain';
import { StyleOverride, LCurly, RCurly } from '../tokens';

// Style related grammar rules extracted from feature grammar.
export function defineStyleGrammar(self: CstParser) {
  const s: any = self;
  s.styleOverrideBlock = s.RULE('styleOverrideBlock', () => {
    s.CONSUME(StyleOverride);
    s.CONSUME(LCurly);
    s.OPTION(() => s.SUBRULE(s.rawContent));
    s.CONSUME(RCurly);
  });
  // Only style_override form is supported; legacy style:override removed.
}
