import { CstParser } from 'chevrotain';
import { On, Load, UI, LCurly, RCurly, LParen, RParen, Colon, Guard, Identifier } from '../tokens';

// UI lifecycle and guard related grammar extraction.
export function defineUiLifecycleGrammar(self: CstParser) {
  const s: any = self;
  s.guardClause = s.RULE('guardClause', () => {
    s.CONSUME(LParen);
    s.CONSUME(Guard);
    s.CONSUME(Colon);
    s.CONSUME(Identifier);
    s.CONSUME(RParen);
  });
  s.onLoadBlock = s.RULE('onLoadBlock', () => {
    s.CONSUME(On);
    s.CONSUME(Load);
    s.CONSUME(LCurly);
    s.OPTION(() => s.SUBRULE(s.rawContent));
    s.CONSUME(RCurly);
  });
  s.uiBlock = s.RULE('uiBlock', () => {
    s.CONSUME(UI);
    s.CONSUME(LCurly);
    s.OPTION(() => s.SUBRULE(s.rawContent));
    s.CONSUME(RCurly);
  });
}
