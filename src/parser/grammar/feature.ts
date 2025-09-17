import { CstParser } from 'chevrotain';
import {
  Page, Component, Store, State, Action, On, Load, UI, Param, List, Of, Equals, Identifier, LCurly, RCurly, Comma,
  StringLiteral, NumberLiteral, LBracketTok, RBracketTok, LParen, RParen, SemicolonTok, StyleKw, OverrideKw, StyleOverride,
  StringT, TextT, IntegerT, DecimalT, BooleanT, DateTimeT, JsonT, Question, Colon, Guard
} from '../tokens';

// Feature (page/component/store/ui/style/state/action) grammar extraction (no rawContent here)
export function defineFeatureGrammar(self: CstParser) {
  const s: any = self;
  s.pageBlock = s.RULE('pageBlock', () => {
    s.CONSUME(Page); s.CONSUME(Identifier); s.OPTION(() => s.SUBRULE(s.guardClause)); s.CONSUME(LCurly);
    s.MANY(() => s.OR([
      { GATE: () => s.LA(1).tokenType === State, ALT: () => s.SUBRULE(s.stateBlock) },
      { GATE: () => s.LA(1).tokenType === On && s.LA(2).tokenType === Load, ALT: () => s.SUBRULE(s.onLoadBlock) },
      { GATE: () => s.LA(1).tokenType === Action, ALT: () => s.SUBRULE(s.actionDecl) },
      { GATE: () => s.LA(1).tokenType === UI, ALT: () => s.SUBRULE(s.uiBlock) },
  { ALT: () => s.SUBRULE(s.rawContent) },
    ]));
    s.CONSUME(RCurly);
  });
  s.guardClause = s.RULE('guardClause', () => { s.CONSUME(LParen); s.CONSUME(Guard); s.CONSUME(Colon); s.CONSUME(Identifier); s.CONSUME(RParen); });
  s.componentBlock = s.RULE('componentBlock', () => {
    s.CONSUME(Component); s.CONSUME(Identifier); s.CONSUME(LCurly);
    s.MANY(() => s.OR([
      { GATE: () => s.LA(1).tokenType === Param, ALT: () => s.SUBRULE(s.paramDecl) },
      { GATE: () => s.LA(1).tokenType === UI, ALT: () => s.SUBRULE(s.uiBlock) },
      { GATE: () => s.LA(1).tokenType === StyleKw, ALT: () => s.SUBRULE(s.styleBlock) },
      { GATE: () => s.LA(1).tokenType === StyleOverride, ALT: () => s.SUBRULE(s.styleOverrideBlock) },
  { ALT: () => s.SUBRULE(s.rawContent) },
    ]));
    s.CONSUME(RCurly);
  });
  s.styleOverrideBlock = s.RULE('styleOverrideBlock', () => { s.CONSUME(StyleOverride); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
  s.styleBlock = s.RULE('styleBlock', () => { s.CONSUME(StyleKw); s.CONSUME(Colon); s.CONSUME(OverrideKw); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
  s.storeBlock = s.RULE('storeBlock', () => { s.CONSUME(Store); s.CONSUME(Identifier); s.CONSUME(LCurly); s.MANY(() => s.OR([
    { GATE: () => s.LA(1).tokenType === State, ALT: () => s.SUBRULE(s.stateBlock) },
    { GATE: () => s.LA(1).tokenType === Action, ALT: () => s.SUBRULE(s.actionDecl) },
  { ALT: () => s.SUBRULE(s.rawContent) },
  ])); s.CONSUME(RCurly); });
  s.stateBlock = s.RULE('stateBlock', () => { s.CONSUME(State); s.CONSUME(LCurly); s.MANY(() => s.SUBRULE(s.stateDecl)); s.CONSUME(RCurly); });
  s.stateDecl = s.RULE('stateDecl', () => { s.CONSUME(Identifier); s.CONSUME(Colon); s.OR([
    { ALT: () => { s.CONSUME(List); s.CONSUME(Of); s.SUBRULE(s.typeNameFeature); } },
    { ALT: () => s.SUBRULE1(s.typeNameFeature) },
  ]); s.OPTION(() => s.CONSUME(Question)); s.CONSUME(Equals); s.OR1([
    { ALT: () => s.CONSUME(StringLiteral) },
    { ALT: () => s.CONSUME(NumberLiteral) },
    { ALT: () => s.CONSUME1(Identifier) },
    { ALT: () => { s.CONSUME(LBracketTok); s.CONSUME(RBracketTok); } },
  { ALT: () => { s.CONSUME(LParen); s.SUBRULE(s.rawContent); s.CONSUME(RParen); } },
  ]); s.OPTION1(() => s.CONSUME(SemicolonTok)); });
  s.onLoadBlock = s.RULE('onLoadBlock', () => { s.CONSUME(On); s.CONSUME(Load); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
  s.actionDecl = s.RULE('actionDecl', () => { s.CONSUME(Action); s.CONSUME(Identifier); s.OPTION(() => { s.CONSUME(LParen); s.OPTION1(() => { s.SUBRULE(s.actionParam); s.MANY(() => { s.CONSUME(Comma); s.SUBRULE1(s.actionParam); }); }); s.CONSUME(RParen); }); s.CONSUME(LCurly); s.OPTION2(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
  s.actionParam = s.RULE('actionParam', () => { s.CONSUME1(Identifier); s.OPTION(() => { s.CONSUME(Colon); s.SUBRULE(s.typeNameFeature); s.OPTION1(() => s.CONSUME(Question)); }); });
  s.paramDecl = s.RULE('paramDecl', () => { s.CONSUME(Param); s.CONSUME(Identifier); s.CONSUME(Colon); s.OR([
    { ALT: () => { s.CONSUME(List); s.CONSUME(Of); s.SUBRULE(s.typeNameFeature); } },
    { ALT: () => s.SUBRULE1(s.typeNameFeature) },
  ]); s.OPTION(() => s.CONSUME(Question)); s.OPTION1(() => { s.CONSUME(Equals); s.SUBRULE(s.rawContent); }); });
  s.typeNameFeature = s.RULE('typeNameFeature', () => { s.OR([
    { ALT: () => s.CONSUME(Identifier) }, { ALT: () => s.CONSUME(StringT) }, { ALT: () => s.CONSUME(TextT) }, { ALT: () => s.CONSUME(IntegerT) }, { ALT: () => s.CONSUME(DecimalT) }, { ALT: () => s.CONSUME(BooleanT) }, { ALT: () => s.CONSUME(DateTimeT) }, { ALT: () => s.CONSUME(JsonT) }
  ]); });
  s.uiBlock = s.RULE('uiBlock', () => { s.CONSUME(UI); s.CONSUME(LCurly); s.OPTION(() => s.SUBRULE(s.rawContent)); s.CONSUME(RCurly); });
}
