import { CstParser } from 'chevrotain';
import {
  LCurly, RCurly, Identifier, StringLiteral, NumberLiteral, StringT, TextT, IntegerT, DecimalT, BooleanT, DateTimeT,
  JsonT, List, Of, On, Load, Page, Component, Store, State, Action, UI, LParen, RParen, Colon, Comma, Equals, Question,
  Less, Greater, SlashTok, DotTok, PlusTok, HyphenTok, SemicolonTok, LBracketTok, RBracketTok, SingleQuoteTok, Unknown
} from '../tokens';

// Common reusable fragments
export function defineCommonGrammar(self: CstParser) {
  const s: any = self;
  s.rawContent = s.RULE('rawContent', () => {
    s.AT_LEAST_ONE(() => s.OR([
      { ALT: () => { s.CONSUME(LCurly); s.CONSUME(RCurly); } },
      { ALT: () => { s.CONSUME1(LCurly); s.SUBRULE(s.rawContent); s.CONSUME1(RCurly); } },
      { ALT: () => s.CONSUME(Identifier) },
      { ALT: () => s.CONSUME(StringLiteral) },
      { ALT: () => s.CONSUME(NumberLiteral) },
      { ALT: () => s.CONSUME(StringT) },
      { ALT: () => s.CONSUME(TextT) },
      { ALT: () => s.CONSUME(IntegerT) },
      { ALT: () => s.CONSUME(DecimalT) },
      { ALT: () => s.CONSUME(BooleanT) },
      { ALT: () => s.CONSUME(DateTimeT) },
      { ALT: () => s.CONSUME(JsonT) },
      { ALT: () => s.CONSUME(List) },
      { ALT: () => s.CONSUME(Of) },
      { ALT: () => s.CONSUME(On) },
      { ALT: () => s.CONSUME(Load) },
      { ALT: () => s.CONSUME(Page) },
      { ALT: () => s.CONSUME(Component) },
      { ALT: () => s.CONSUME(Store) },
      { ALT: () => s.CONSUME(State) },
      { ALT: () => s.CONSUME(Action) },
      { ALT: () => s.CONSUME(UI) },
      { ALT: () => s.CONSUME(LParen) },
      { ALT: () => s.CONSUME(RParen) },
      { ALT: () => s.CONSUME(Colon) },
      { ALT: () => s.CONSUME(Comma) },
      { ALT: () => s.CONSUME(Equals) },
      { ALT: () => s.CONSUME(Question) },
      { ALT: () => s.CONSUME(Less) },
      { ALT: () => s.CONSUME(Greater) },
      { ALT: () => s.CONSUME(SlashTok) },
      { ALT: () => s.CONSUME(DotTok) },
      { ALT: () => s.CONSUME(PlusTok) },
      { ALT: () => s.CONSUME(HyphenTok) },
      { ALT: () => s.CONSUME(SemicolonTok) },
      { ALT: () => s.CONSUME(LBracketTok) },
      { ALT: () => s.CONSUME(RBracketTok) },
      { ALT: () => s.CONSUME(SingleQuoteTok) },
      { ALT: () => s.CONSUME(Unknown) },
    ]));
  });
}
