import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { DatabaseBlock, Entity, Field, FieldAttribute, FieldType, Relation } from '../../ast';
import { posOf, defineHidden } from '../builderUtils';
import { mapPrimitiveToken, collectFieldAttributes, collectRelationAttributes } from './helpers';

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
        const isList = !!typeCh['List'];
  const typeTokenName = Object.keys(typeCh).find(k => [ 'StringT','TextT','IntegerT','DecimalT','BooleanT','DateTimeT','JsonT','BigIntT','FloatT','UUIDT','EmailT','URLT' ].includes(k));
        const optional = !!typeCh['Question'];
  let nullable = false;
        if (!nullable && typeCh['Identifier']) {
          const ids = (typeCh['Identifier'] as any[]);
          if (ids.some(t => t.image === 'nullable')) nullable = true;
        }
        let fieldType: any;
        if (isList) {
          primitiveTokenName = Object.keys(scalarNodes.length ? scalarNodes[0].children as CstChildrenDictionary : typeCh).find(k => [ 'StringT','TextT','IntegerT','DecimalT','BooleanT','DateTimeT','JsonT','BigIntT','FloatT','UUIDT','EmailT','URLT' ].includes(k));
          fieldType = { kind: 'list', of: mapPrimitiveToken(primitiveTokenName!), optional, nullable };
        } else {
          primitiveTokenName = scalarNodes.length ? Object.keys(scalarNodes[0].children as CstChildrenDictionary).find(k => [ 'StringT','TextT','IntegerT','DecimalT','BooleanT','DateTimeT','JsonT','BigIntT','FloatT','UUIDT','EmailT','URLT' ].includes(k)) : typeTokenName;
          fieldType = { kind: 'primitive', name: mapPrimitiveToken(primitiveTokenName!) } as FieldType;
          if (optional) fieldType.optional = true;
          if (nullable) (fieldType as any).nullable = true;
        }
  const attrGroups = (fdCh['fieldAttributeGroup'] as CstNode[]) || [];
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
        const targetTokens = rch['Identifier'] as IToken[];
        const targetTok = targetTokens[targetTokens.length - 1];
        const target = targetTok.image;
  const attrGroups2 = (rch['fieldAttributeGroup'] as CstNode[]) || [];
  const attributes: FieldAttribute[] = collectRelationAttributes(attrGroups2);
        const relNode: any = { name: relName, kind, target, attributes };
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
