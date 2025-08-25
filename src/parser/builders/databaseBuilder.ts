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
        const isList = !!typeCh['List'];
  const typeTokenName = Object.keys(typeCh).find(k => [ 'StringT','TextT','IntegerT','DecimalT','BooleanT','DateTimeT','JsonT' ].includes(k));
        const optional = !!typeCh['Question'];
        let fieldType: any;
        if (isList) {
          fieldType = { kind: 'list', of: mapPrimitiveToken(typeTokenName!), optional };
        } else {
          fieldType = { kind: 'primitive', name: mapPrimitiveToken(typeTokenName!) } as FieldType;
          if (optional) fieldType.optional = true;
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
