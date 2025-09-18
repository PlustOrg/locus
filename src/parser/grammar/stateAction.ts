import { CstParser } from 'chevrotain';
import {
  State, Action, Param, List, Of, Equals, Identifier, LCurly, RCurly, Comma, StringLiteral, NumberLiteral,
  LBracketTok, RBracketTok, LParen, RParen, SemicolonTok, StringT, TextT, IntegerT, DecimalT, BooleanT, DateTimeT,
  JsonT, Question, Colon
} from '../tokens';

// State, action, params, and type name grammar extraction.
export function defineStateActionGrammar(self: CstParser) {
  const s: any = self;
  s.stateBlock = s.RULE('stateBlock', () => {
    s.CONSUME(State);
    s.CONSUME(LCurly);
    s.MANY(() => s.SUBRULE(s.stateDecl));
    s.CONSUME(RCurly);
  });
  s.stateDecl = s.RULE('stateDecl', () => {
    s.CONSUME(Identifier);
    s.CONSUME(Colon);
    s.OR([
      { ALT: () => { s.CONSUME(List); s.CONSUME(Of); s.SUBRULE(s.typeNameFeature); } },
      { ALT: () => s.SUBRULE1(s.typeNameFeature) },
    ]);
    s.OPTION(() => s.CONSUME(Question));
    s.CONSUME(Equals);
    s.OR1([
      { ALT: () => s.CONSUME(StringLiteral) },
      { ALT: () => s.CONSUME(NumberLiteral) },
      { ALT: () => s.CONSUME1(Identifier) },
      { ALT: () => { s.CONSUME(LBracketTok); s.CONSUME(RBracketTok); } },
      { ALT: () => { s.CONSUME(LParen); s.SUBRULE(s.rawContent); s.CONSUME(RParen); } },
    ]);
    s.OPTION1(() => s.CONSUME(SemicolonTok));
  });
  s.actionDecl = s.RULE('actionDecl', () => {
    s.CONSUME(Action);
    s.CONSUME(Identifier);
    s.OPTION(() => {
      s.CONSUME(LParen);
      s.OPTION1(() => {
        s.SUBRULE(s.actionParam);
        s.MANY(() => { s.CONSUME(Comma); s.SUBRULE1(s.actionParam); });
      });
      s.CONSUME(RParen);
    });
    s.CONSUME(LCurly);
    s.OPTION2(() => s.SUBRULE(s.rawContent));
    s.CONSUME(RCurly);
  });
  s.actionParam = s.RULE('actionParam', () => {
    s.CONSUME1(Identifier);
    s.OPTION(() => {
      s.CONSUME(Colon);
      s.SUBRULE(s.typeNameFeature);
      s.OPTION1(() => s.CONSUME(Question));
    });
  });
  s.paramDecl = s.RULE('paramDecl', () => {
    s.CONSUME(Param);
    s.CONSUME(Identifier);
    s.CONSUME(Colon);
    s.OR([
      { ALT: () => { s.CONSUME(List); s.CONSUME(Of); s.SUBRULE(s.typeNameFeature); } },
      { ALT: () => s.SUBRULE1(s.typeNameFeature) },
    ]);
    s.OPTION(() => s.CONSUME(Question));
    s.OPTION1(() => { s.CONSUME(Equals); s.SUBRULE(s.rawContent); });
  });
  s.typeNameFeature = s.RULE('typeNameFeature', () => {
    s.OR([
      { ALT: () => s.CONSUME(Identifier) },
      { ALT: () => s.CONSUME(StringT) },
      { ALT: () => s.CONSUME(TextT) },
      { ALT: () => s.CONSUME(IntegerT) },
      { ALT: () => s.CONSUME(DecimalT) },
      { ALT: () => s.CONSUME(BooleanT) },
      { ALT: () => s.CONSUME(DateTimeT) },
      { ALT: () => s.CONSUME(JsonT) },
    ]);
  });
}
