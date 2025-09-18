import { CstParser } from 'chevrotain';
import {
  Unique, Default, MapTok, Policy, AtSign, MinTok, MaxKw, LengthTok, PatternTok, EmailT,
  Identifier, LParen, RParen, Comma, Colon, NumberLiteral, StringLiteral
} from '../tokens';

// Database annotation & attribute related rules extracted from database.ts
export function defineDatabaseAnnotationsGrammar(self: CstParser) {
  const s: any = self;
  s.fieldAttributeGroup = s.RULE('fieldAttributeGroup', () => {
    s.CONSUME(LParen);
    s.OR([
      { ALT: () => s.CONSUME(Unique) },
      { ALT: () => s.SUBRULE(s.defaultAttr) },
      { ALT: () => s.SUBRULE(s.mapAttr) },
      { ALT: () => s.SUBRULE(s.policyAttr) },
    ]);
    s.CONSUME(RParen);
  });
  s.fieldAnnotation = s.RULE('fieldAnnotation', () => {
    s.CONSUME(AtSign as any);
    s.OR([
      { ALT: () => s.CONSUME(Unique) },
      { ALT: () => s.SUBRULE(s.defaultAnn) },
      { ALT: () => s.SUBRULE(s.mapAnn) },
      { ALT: () => s.SUBRULE(s.policyAnn) },
      { ALT: () => s.SUBRULE(s.constraintAnn) },
    ]);
  });
  s.constraintAnn = s.RULE('constraintAnn', () => {
    s.OR([
      { ALT: () => {
        s.OR1([
          { ALT: () => s.CONSUME(MinTok as any) },
          { ALT: () => s.CONSUME(MaxKw) },
          { ALT: () => s.CONSUME(LengthTok as any) },
          { ALT: () => s.CONSUME(PatternTok as any) },
          { ALT: () => s.CONSUME(EmailT) },
          { ALT: () => s.CONSUME(Identifier) },
        ]);
        s.OPTION(() => {
          s.CONSUME(LParen);
          s.OPTION1(() => s.SUBRULE(s.literal));
          s.MANY(() => { s.CONSUME(Comma); s.SUBRULE1(s.literal); });
          s.CONSUME(RParen);
        });
      } },
    ]);
  });
  s.defaultAnn = s.RULE('defaultAnn', () => { s.CONSUME(Default); s.CONSUME(LParen); s.SUBRULE(s.annotationValueList); s.CONSUME(RParen); });
  s.mapAnn = s.RULE('mapAnn', () => { s.CONSUME(MapTok); s.CONSUME(LParen); s.CONSUME(StringLiteral); s.CONSUME(RParen); });
  s.policyAnn = s.RULE('policyAnn', () => { s.CONSUME(Policy); s.CONSUME(LParen); s.CONSUME1(Identifier); s.CONSUME(RParen); });
  s.annotationValueList = s.RULE('annotationValueList', () => {
    s.OR([
      { ALT: () => s.CONSUME(NumberLiteral) },
      { ALT: () => s.CONSUME(StringLiteral) },
      { ALT: () => s.SUBRULE(s.callExpr) },
      { ALT: () => s.CONSUME(Identifier) },
    ]);
  });
  s.defaultAttr = s.RULE('defaultAttr', () => { s.CONSUME(Default); s.CONSUME(Colon); s.OR([
    { ALT: () => s.CONSUME(NumberLiteral) },
    { ALT: () => s.CONSUME(StringLiteral) },
    { ALT: () => s.SUBRULE(s.callExpr) },
    { ALT: () => s.CONSUME1(Identifier) },
  ]); });
  s.mapAttr = s.RULE('mapAttr', () => { s.CONSUME(MapTok); s.CONSUME(Colon); s.CONSUME(StringLiteral); });
  s.policyAttr = s.RULE('policyAttr', () => { s.CONSUME(Policy); s.CONSUME(Colon); s.CONSUME1(Identifier); });
  s.callExpr = s.RULE('callExpr', () => { s.CONSUME(Identifier); s.CONSUME(LParen); s.OPTION(() => { s.SUBRULE(s.literal); s.MANY(() => { s.CONSUME(Comma); s.SUBRULE1(s.literal); }); }); s.CONSUME(RParen); });
  s.literal = s.RULE('literal', () => { s.OR([
    { ALT: () => s.CONSUME(NumberLiteral) },
    { ALT: () => s.CONSUME(StringLiteral) },
    { ALT: () => s.CONSUME(Identifier) },
  ]); });
}
