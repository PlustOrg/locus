import { CstParser } from 'chevrotain';
import {
  Database, Entity, Identifier, LCurly, RCurly, Colon, StringT, TextT, IntegerT, DecimalT, BooleanT, DateTimeT, JsonT,
  BigIntT, FloatT, UUIDT, EmailT, URLT, List, Of, Question, LBracketTok, RBracketTok, PipeTok, NullT,
  HasMany, BelongsTo, HasOne, OnDelete
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
  // Annotation & attribute rules moved to databaseAnnotations.ts
}
