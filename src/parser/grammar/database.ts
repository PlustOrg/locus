import { CstParser } from 'chevrotain';
import { Database, Entity, Identifier, LCurly, RCurly, Colon } from '../tokens';

// Database & entity grammar extraction
export function defineDatabaseGrammar(self: CstParser) {
  const s: any = self;
  s.databaseBlock = s.RULE('databaseBlock', () => { s.CONSUME(Database); s.CONSUME(LCurly); s.MANY(() => s.SUBRULE(s.entityDecl)); s.CONSUME(RCurly); });
  s.entityDecl = s.RULE('entityDecl', () => { s.CONSUME(Entity); s.CONSUME(Identifier); s.CONSUME(LCurly); s.MANY(() => s.OR([{ ALT: () => s.SUBRULE(s.fieldDecl) }, { ALT: () => s.SUBRULE(s.relationDecl) }])); s.CONSUME(RCurly); });
  s.fieldDecl = s.RULE('fieldDecl', () => { s.CONSUME(Identifier); s.CONSUME(Colon); s.SUBRULE(s.fieldType); s.MANY(() => s.OR([{ ALT: () => s.SUBRULE(s.fieldAttributeGroup) }, { ALT: () => s.SUBRULE(s.fieldAnnotation) }])); });
  // scalarType, fieldType, relationDecl moved to databaseTypesRelations.ts
  // Annotation & attribute rules moved to databaseAnnotations.ts
}
