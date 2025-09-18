import { CstParser } from 'chevrotain';
import { Page, Component, Store, State, Action, Identifier, LCurly, RCurly } from '../tokens';

// Feature (page/component/store/ui/style/state/action) grammar extraction (no rawContent here)
export function defineFeatureGrammar(self: CstParser) {
  const s: any = self;
  s.pageBlock = s.RULE('pageBlock', () => {
  s.CONSUME(Page); s.CONSUME(Identifier); s.OPTION(() => s.SUBRULE(s.guardClause)); s.CONSUME(LCurly);
    s.MANY(() => s.OR([
  { GATE: () => s.LA(1).tokenType === State, ALT: () => s.SUBRULE(s.stateBlock) },
  { GATE: () => s.LA(1).tokenType.name === 'On' && s.LA(2).tokenType.name === 'Load', ALT: () => s.SUBRULE(s.onLoadBlock) },
  { GATE: () => s.LA(1).tokenType === Action, ALT: () => s.SUBRULE(s.actionDecl) },
  { GATE: () => s.LA(1).tokenType.name === 'UI', ALT: () => s.SUBRULE(s.uiBlock) },
  { ALT: () => s.SUBRULE(s.rawContent) },
    ]));
    s.CONSUME(RCurly);
  });
  // guardClause now provided by uiLifecycle.ts
  s.componentBlock = s.RULE('componentBlock', () => {
    s.CONSUME(Component); s.CONSUME(Identifier); s.CONSUME(LCurly);
    s.MANY(() => s.OR([
  { GATE: () => s.LA(1).tokenType.name === 'Param', ALT: () => s.SUBRULE(s.paramDecl) },
  { GATE: () => s.LA(1).tokenType.name === 'UI', ALT: () => s.SUBRULE(s.uiBlock) },
  { GATE: () => s.LA(1).tokenType.name === 'StyleKw' && s.LA(2).tokenType.name === 'Colon' && s.LA(3).tokenType.name === 'OverrideKw', ALT: () => s.SUBRULE(s.styleBlock) },
  { GATE: () => s.LA(1).tokenType.name === 'StyleOverride', ALT: () => s.SUBRULE(s.styleOverrideBlock) },
  { ALT: () => s.SUBRULE(s.rawContent) },
    ]));
    s.CONSUME(RCurly);
  });
  // styleOverrideBlock defined in style.ts
  s.storeBlock = s.RULE('storeBlock', () => { s.CONSUME(Store); s.CONSUME(Identifier); s.CONSUME(LCurly); s.MANY(() => s.OR([
    { GATE: () => s.LA(1).tokenType === State, ALT: () => s.SUBRULE(s.stateBlock) },
    { GATE: () => s.LA(1).tokenType === Action, ALT: () => s.SUBRULE(s.actionDecl) },
    { ALT: () => s.SUBRULE(s.rawContent) },
  ])); s.CONSUME(RCurly); });
  // stateBlock, stateDecl, actionDecl, actionParam, paramDecl, typeNameFeature now defined in stateAction.ts
  // onLoadBlock moved to uiLifecycle.ts
  // uiBlock moved to uiLifecycle.ts
}
