import { CstParser } from 'chevrotain';
import {
  Database, Entity, Identifier, LCurly, RCurly, Colon, StringT, TextT, IntegerT, DecimalT, BooleanT, DateTimeT, JsonT,
  BigIntT, FloatT, UUIDT, EmailT, URLT, List, Of, Question, LBracketTok, RBracketTok, PipeTok, NullT,
  HasMany, BelongsTo, HasOne, OnDelete, Unique, Default, MapTok, Policy, AtSign, MinTok, MaxKw, LengthTok, PatternTok,
  NumberLiteral, StringLiteral, Comma, LParen, RParen
} from '../tokens';

// Database & entity grammar extraction
export function defineDatabaseGrammar(self: CstParser) {
  const s: any = self;
  s.databaseBlock = s.RULE('databaseBlock', () => { s.CONSUME(Database); s.CONSUME(LCurly); s.MANY(() => s.SUBRULE(s.entityDecl)); s.CONSUME(RCurly); });
  s.entityDecl = s.RULE('entityDecl', () => { s.CONSUME(Entity); s.CONSUME(Identifier); s.CONSUME(LCurly); s.MANY(() => s.OR([{ ALT: () => s.SUBRULE(s.fieldDecl) }, { ALT: () => s.SUBRULE(s.relationDecl) }])); s.CONSUME(RCurly); });
  s.fieldDecl = s.RULE('fieldDecl', () => { s.CONSUME(Identifier); s.CONSUME(Colon); s.SUBRULE(s.fieldType); s.MANY(() => s.OR([{ ALT: () => s.SUBRULE(s.fieldAttributeGroup) }, { ALT: () => s.SUBRULE(s.fieldAnnotation) }])); });
  s.scalarType = s.RULE('scalarType', () => { s.OR([{ ALT: () => s.CONSUME(StringT) }, { ALT: () => s.CONSUME(TextT) }, { ALT: () => s.CONSUME(IntegerT) }, { ALT: () => s.CONSUME(DecimalT) }, { ALT: () => s.CONSUME(BooleanT) }, { ALT: () => s.CONSUME(DateTimeT) }, { ALT: () => s.CONSUME(JsonT) }, { ALT: () => s.CONSUME(BigIntT) }, { ALT: () => s.CONSUME(FloatT) }, { ALT: () => s.CONSUME(UUIDT) }, { ALT: () => s.CONSUME(EmailT) }, { ALT: () => s.CONSUME(URLT) }]); });
  s.fieldType = s.RULE('fieldType', () => { s.OR([
    { ALT: () => { s.CONSUME(List); s.CONSUME(Of); s.SUBRULE(s.scalarType); s.OPTION(() => s.CONSUME(Question)); } },
    { ALT: () => { s.SUBRULE1(s.scalarType); s.OPTION1(() => s.CONSUME1(Question)); s.OPTION2(() => { s.CONSUME(LBracketTok); s.CONSUME(RBracketTok); }); } },
  ]); s.OPTION3(() => { if (s.LA(1).image === 'nullable') s.CONSUME(Identifier); }); s.OPTION4(() => { if (s.LA(1).tokenType === PipeTok) { s.CONSUME(PipeTok); s.CONSUME(NullT); } }); });
  s.relationDecl = s.RULE('relationDecl', () => { s.CONSUME1(Identifier); s.CONSUME(Colon); s.OR([{ ALT: () => s.CONSUME(HasMany) }, { ALT: () => s.CONSUME(BelongsTo) }, { ALT: () => s.CONSUME(HasOne) }]); s.CONSUME2(Identifier); s.MANY(() => s.OR1([{ ALT: () => s.SUBRULE(s.fieldAttributeGroup) }, { ALT: () => s.SUBRULE(s.fieldAnnotation) }])); s.OPTION4(() => { s.CONSUME(OnDelete); s.CONSUME1(Colon); s.CONSUME3(Identifier); }); s.OPTION5(() => { if (s.LA(1).tokenType === Identifier && s.LA(1).image === 'inverse') { s.CONSUME4(Identifier); s.CONSUME2(Colon); s.CONSUME5(Identifier); } }); });
  s.fieldAttributeGroup = s.RULE('fieldAttributeGroup', () => { s.CONSUME(LParen); s.OR([{ ALT: () => s.CONSUME(Unique) }, { ALT: () => s.SUBRULE(s.defaultAttr) }, { ALT: () => s.SUBRULE(s.mapAttr) }, { ALT: () => s.SUBRULE(s.policyAttr) }]); s.CONSUME(RParen); });
  s.fieldAnnotation = s.RULE('fieldAnnotation', () => { s.CONSUME(AtSign as any); s.OR([{ ALT: () => s.CONSUME(Unique) }, { ALT: () => s.SUBRULE(s.defaultAnn) }, { ALT: () => s.SUBRULE(s.mapAnn) }, { ALT: () => s.SUBRULE(s.policyAnn) }, { ALT: () => s.SUBRULE(s.constraintAnn) }]); });
  s.constraintAnn = s.RULE('constraintAnn', () => { s.OR([{ ALT: () => { s.OR1([{ ALT: () => s.CONSUME(MinTok as any) }, { ALT: () => s.CONSUME(MaxKw) }, { ALT: () => s.CONSUME(LengthTok as any) }, { ALT: () => s.CONSUME(PatternTok as any) }, { ALT: () => s.CONSUME(EmailT) }, { ALT: () => s.CONSUME(Identifier) }]); s.OPTION(() => { s.CONSUME(LParen); s.OPTION1(() => s.SUBRULE(s.literal)); s.MANY(() => { s.CONSUME(Comma); s.SUBRULE1(s.literal); }); s.CONSUME(RParen); }); } }]); });
  s.defaultAnn = s.RULE('defaultAnn', () => { s.CONSUME(Default); s.CONSUME(LParen); s.SUBRULE(s.annotationValueList); s.CONSUME(RParen); });
  s.mapAnn = s.RULE('mapAnn', () => { s.CONSUME(MapTok); s.CONSUME(LParen); s.CONSUME(StringLiteral); s.CONSUME(RParen); });
  s.policyAnn = s.RULE('policyAnn', () => { s.CONSUME(Policy); s.CONSUME(LParen); s.CONSUME1(Identifier); s.CONSUME(RParen); });
  s.annotationValueList = s.RULE('annotationValueList', () => { s.OR([{ ALT: () => s.CONSUME(NumberLiteral) }, { ALT: () => s.CONSUME(StringLiteral) }, { ALT: () => s.SUBRULE(s.callExpr) }, { ALT: () => s.CONSUME(Identifier) }]); });
  s.defaultAttr = s.RULE('defaultAttr', () => { s.CONSUME(Default); s.CONSUME(Colon); s.OR([{ ALT: () => s.CONSUME(NumberLiteral) }, { ALT: () => s.CONSUME(StringLiteral) }, { ALT: () => s.SUBRULE(s.callExpr) }, { ALT: () => s.CONSUME1(Identifier) }]); });
  s.mapAttr = s.RULE('mapAttr', () => { s.CONSUME(MapTok); s.CONSUME(Colon); s.CONSUME(StringLiteral); });
  s.policyAttr = s.RULE('policyAttr', () => { s.CONSUME(Policy); s.CONSUME(Colon); s.CONSUME1(Identifier); });
  s.callExpr = s.RULE('callExpr', () => { s.CONSUME(Identifier); s.CONSUME(LParen); s.OPTION(() => { s.SUBRULE(s.literal); s.MANY(() => { s.CONSUME(Comma); s.SUBRULE1(s.literal); }); }); s.CONSUME(RParen); });
  s.literal = s.RULE('literal', () => { s.OR([{ ALT: () => s.CONSUME(NumberLiteral) }, { ALT: () => s.CONSUME(StringLiteral) }, { ALT: () => s.CONSUME(Identifier) }]); });
}
