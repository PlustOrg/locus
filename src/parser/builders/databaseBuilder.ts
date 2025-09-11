import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { DatabaseBlock, Entity, Field, FieldAttribute, FieldType, Relation } from '../../ast';
import { posOf, defineHidden } from '../builderUtils';
import { mapPrimitiveToken, collectFieldAttributes, collectRelationAttributes } from './helpers';
import { registerDeprecation } from '../../deprecations';

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
        const typeTokenName = Object.keys(typeCh).find(k => [ 'StringT','TextT','IntegerT','DecimalT','BooleanT','DateTimeT','JsonT','BigIntT','FloatT','UUIDT','EmailT','URLT' ].includes(k));
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
          primitiveTokenName = Object.keys(scalarNodes.length ? scalarNodes[0].children as CstChildrenDictionary : typeCh).find(k => [ 'StringT','TextT','IntegerT','DecimalT','BooleanT','DateTimeT','JsonT','BigIntT','FloatT','UUIDT','EmailT','URLT' ].includes(k));
          fieldType = { kind: 'list', of: mapPrimitiveToken(primitiveTokenName!), optional, nullable };
          if (usedLegacyList) {
            registerDeprecation('list_of_syntax', "'list of Type' syntax is deprecated; use 'Type[]'", '0.5.0', "Replace 'list of String' with 'String[]'");
          }
        } else {
          primitiveTokenName = scalarNodes.length ? Object.keys(scalarNodes[0].children as CstChildrenDictionary).find(k => [ 'StringT','TextT','IntegerT','DecimalT','BooleanT','DateTimeT','JsonT','BigIntT','FloatT','UUIDT','EmailT','URLT' ].includes(k)) : typeTokenName;
          fieldType = { kind: 'primitive', name: mapPrimitiveToken(primitiveTokenName!) } as FieldType;
          if (optional) fieldType.optional = true;
          if (nullable) (fieldType as any).nullable = true;
        }
        const attrGroups = ((fdCh['fieldAttributeGroup'] as CstNode[]) || []).concat((fdCh['fieldAnnotation'] as CstNode[]) || []);
        const attributes: FieldAttribute[] = collectFieldAttributes(attrGroups);
        const fieldNode: any = { name: fieldName, type: fieldType, attributes };
        defineHidden(fieldNode, 'nameLoc', posOf(fieldNameTok));
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
      const entity: any = { name, fields, relations };
      defineHidden(entity, 'nameLoc', posOf(nameTok));
      entities.push(entity);
    }
    databases.push({ type: 'database', entities });
  }
  return databases;
}
