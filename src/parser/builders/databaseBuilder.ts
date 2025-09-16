import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { DatabaseBlock, Entity, Field, FieldAttribute, FieldType, Relation, primitiveCodeOf } from '../../ast';
import { posOf, defineHidden } from '../builderUtils';
import crypto from 'crypto';
import { mapPrimitiveToken, collectFieldAttributes, collectRelationAttributes } from './helpers';
import { detectPrimitive } from '../primitiveTypes';
import { registerDeprecation } from '../../deprecations';

let __allocCount = 0; // instrumentation counter
const fieldPool: any[] = [];
const entityPool: any[] = [];
// Retained for tests (ast_pooling.test.ts)
export function __getAstAllocCount(){ return __allocCount; }
function makeField(init: any): Field {
  if (process.env.LOCUS_AST_POOL === '1' && fieldPool.length) {
    const f = fieldPool.pop();
    Object.assign(f, init);
    return f;
  }
  __allocCount++;
  return init;
}
function makeEntity(init: any): Entity {
  if (process.env.LOCUS_AST_POOL === '1' && entityPool.length) {
    const e = entityPool.pop();
    Object.assign(e, init);
    return e;
  }
  __allocCount++;
  return init;
}

const entityCache = new Map<string, Entity>();
let __entityBuilds = 0; // instrumentation counter
// Retained for tests (cst_entity_cache.test.ts)
export function __getEntityBuildCount(){ return __entityBuilds; }

export function buildDatabaseBlocks(dbNodes: CstNode[]): DatabaseBlock[] {
  const databases: DatabaseBlock[] = [];
  for (const dbNode of dbNodes) {
    const entities: Entity[] = [];
    const dbBlockChildren = dbNode.children as CstChildrenDictionary;
    const entityDecls = (dbBlockChildren['entityDecl'] as CstNode[]) || [];
    for (const ent of entityDecls) {
      const entChildren = ent.children as CstChildrenDictionary;
      const nameTok = (entChildren['Identifier'] as IToken[])[0];
      const name = nameTok.image;
      // hash raw entity text region (approx using token offsets)
      const firstTok = nameTok;
      const lastTokArr = ((entChildren['fieldDecl'] as CstNode[])||[]).slice(-1);
      const lastTok: IToken | undefined = lastTokArr.length ? ((lastTokArr[0].children as any)['RCurly']?.[0] || (lastTokArr[0].children as any)['Identifier']?.slice(-1)[0]) : nameTok;
      const start = firstTok.startOffset ?? 0;
      const end = (lastTok?.endOffset ?? firstTok.endOffset) as number;
  const hash = crypto.createHash('sha1').update(name+':'+String(start)+':'+String(end)).digest('hex');
      if (process.env.LOCUS_CST_CACHE === '1' && entityCache.has(hash)) {
        entities.push(entityCache.get(hash)!);
        continue;
      }
      __entityBuilds++;
      const fields: Field[] = [];
      const relations: Relation[] = [];

      const fieldDecls = (entChildren['fieldDecl'] as CstNode[]) || [];
      for (const fd of fieldDecls) {
        const fdCh = fd.children as CstChildrenDictionary;
        const fieldNameTok = (fdCh['Identifier'] as IToken[])[0];
        const fieldName = fieldNameTok.image;
        const typeAlt = (fdCh['fieldType'] as CstNode[])[0];
        const typeCh = typeAlt.children as CstChildrenDictionary;
        // scalarType nested rule may appear as 'scalarType' or 'scalarType1'
        const scalarNodes = (typeCh['scalarType'] as CstNode[] || []).concat(typeCh['scalarType1'] as any || []);
        let primitiveTokenName: string | undefined;
        const usedLegacyList = !!typeCh['List'];
        const isList = usedLegacyList || (!!typeCh['LBracketTok'] && !!typeCh['RBracketTok']);
  const typeTokenName = detectPrimitive(typeCh as any);
              const optional = !!typeCh['Question'];
        let nullable = false;
        if (!nullable && typeCh['Identifier']) {
          const ids = (typeCh['Identifier'] as any[]);
          if (ids.some(t => t.image === 'nullable')) nullable = true;
          if (ids.some(t => t.image === 'Null')) nullable = true; // pre-NullT legacy fallback
        }
        // Union form with explicit NullT token (via fieldType OPTION3)
        if (!nullable && typeCh['NullT']) nullable = true;
        let fieldType: any;
        if (isList) {
          if (optional) {
            throw new Error("ParseError: Optional list types 'list of Type?' or 'Type[]?' are not allowed; remove '?' after list.");
          }
          const scanChildren = scalarNodes.length ? scalarNodes[0].children as CstChildrenDictionary : typeCh;
          primitiveTokenName = detectPrimitive(scanChildren as any);
          fieldType = { kind: 'list', of: mapPrimitiveToken(primitiveTokenName!), optional, nullable };
          if (usedLegacyList) {
            registerDeprecation('list_of_syntax', "'list of Type' syntax is deprecated; use 'Type[]'", '0.5.0', "Replace 'list of String' with 'String[]'");
          }
        } else {
          primitiveTokenName = scalarNodes.length ? detectPrimitive(scalarNodes[0].children as any) : typeTokenName;
          fieldType = { kind: 'primitive', name: mapPrimitiveToken(primitiveTokenName!) } as FieldType;
          if (optional) fieldType.optional = true;
          if (nullable) (fieldType as any).nullable = true;
        }
        const attrGroups = ((fdCh['fieldAttributeGroup'] as CstNode[]) || []).concat((fdCh['fieldAnnotation'] as CstNode[]) || []);
        const attributes: FieldAttribute[] = collectFieldAttributes(attrGroups);
        // Capture raw field text (between field name token start and end of last attribute token) for downstream analyses.
  // (raw capture placeholder omitted to avoid unused variable warnings)
  if (fieldType && fieldType.kind === 'primitive') (fieldType as any).code = primitiveCodeOf(fieldType.name as any);
  const fieldNode: any = makeField({ name: fieldName, type: fieldType, attributes });
        defineHidden(fieldNode, 'nameLoc', posOf(fieldNameTok));
        // Mark deprecated attribute syntax if any attribute groups used paren style
        if (attrGroups.some(g => (g.children as any).LParen)) fieldNode.raw = (fieldNode.raw || '(attr)');
        fields.push(fieldNode);
      }

      const relationDecls = (entChildren['relationDecl'] as CstNode[]) || [];
      for (const rd of relationDecls) {
        const rch = rd.children as CstChildrenDictionary;
        const idToks = (rch['Identifier'] as IToken[]);
        const relNameTok = idToks[0];
        const relName = relNameTok.image;
        let kind: any = 'has_many';
        if (rch['BelongsTo']) kind = 'belongs_to';
        else if (rch['HasOne']) kind = 'has_one';
        else if (rch['HasMany']) kind = 'has_many';
  const idTokensAll = rch['Identifier'] as IToken[];
  // Pattern: relName (0), target (1), maybe more identifiers inside attributes, maybe action after on_delete
  const targetTok = idTokensAll[1];
  const target = targetTok.image;
        const attrGroups2 = ((rch['fieldAttributeGroup'] as CstNode[]) || []).concat((rch['fieldAnnotation'] as CstNode[]) || []);
        const attributes: FieldAttribute[] = collectRelationAttributes(attrGroups2);
        // Extract referential integrity hint if present
        let onDelete: string | undefined;
  let inverse: string | undefined;
        if (rch['OnDelete']) {
          // Action should appear as the last Identifier after the on_delete clause
          const ids = (rch['Identifier'] as IToken[]);
          if (ids.length >= 3) {
            const actionTok = ids[ids.length - 1];
            if (actionTok.image !== relName && actionTok.image !== target) onDelete = actionTok.image;
          }
        }
        // inverse clause detection: look for identifier 'inverse' and subsequent identifier
        const idsAll = (rch['Identifier'] as IToken[]);
        for (let i=0;i<idsAll.length-1;i++) {
          if (idsAll[i].image === 'inverse') {
            const iv = idsAll[i+1].image;
            if (iv !== relName && iv !== target) inverse = iv;
          }
        }
        const relNode: any = { name: relName, kind, target, attributes };
        if (onDelete) relNode.onDelete = onDelete;
        if (inverse) relNode.inverse = inverse;
        defineHidden(relNode, 'nameLoc', posOf(relNameTok));
        defineHidden(relNode, 'targetLoc', posOf(targetTok));
        relations.push(relNode);
      }
  const entity: any = makeEntity({ name, fields, relations });
      defineHidden(entity, 'nameLoc', posOf(nameTok));
  entities.push(entity);
  if (process.env.LOCUS_CST_CACHE === '1') entityCache.set(hash, entity);
    }
    databases.push({ type: 'database', entities });
  }
  return databases;
}
