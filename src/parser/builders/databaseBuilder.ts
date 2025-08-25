import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { DatabaseBlock, Entity, Field, FieldAttribute, FieldAttributeDefault, FieldAttributeMap, FieldAttributeUnique, FieldType, Relation } from '../../ast';
import { posOf, defineHidden } from '../builderUtils';

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
        const mapName = (key: string): FieldType['name'] => {
          switch (key) {
            case 'StringT': return 'String';
            case 'TextT': return 'Text';
            case 'IntegerT': return 'Integer';
            case 'DecimalT': return 'Decimal';
            case 'BooleanT': return 'Boolean';
            case 'DateTimeT': return 'DateTime';
            case 'JsonT': return 'Json';
            default: return 'String';
          }
        };
        let fieldType: any;
        if (isList) {
          fieldType = { kind: 'list', of: mapName(typeTokenName!), optional };
        } else {
          fieldType = { kind: 'primitive', name: mapName(typeTokenName!) } as FieldType;
          if (optional) fieldType.optional = true;
        }
        const attributes: FieldAttribute[] = [];
        const attrGroups = (fdCh['fieldAttributeGroup'] as CstNode[]) || [];
        for (const ag of attrGroups) {
          const agCh = ag.children as CstChildrenDictionary;
          if (agCh['Unique']) {
            attributes.push({ kind: 'unique' } as FieldAttributeUnique);
          } else if (agCh['defaultAttr']) {
            const defNode = (agCh['defaultAttr'] as CstNode[])[0];
            const dch = defNode.children as CstChildrenDictionary;
            const num = dch['NumberLiteral'] as IToken[] | undefined;
            const str = dch['StringLiteral'] as IToken[] | undefined;
            const ident = dch['Identifier'] as IToken[] | undefined;
            if (num) {
              attributes.push({ kind: 'default', value: Number(num[0].image) } as FieldAttributeDefault);
            } else if (str) {
              attributes.push({ kind: 'default', value: str[0].image.slice(1, -1) } as FieldAttributeDefault);
            } else if (ident) {
              const id = ident[0].image;
              if (id === 'true' || id === 'false') {
                attributes.push({ kind: 'default', value: id === 'true' } as FieldAttributeDefault);
              } else {
                attributes.push({ kind: 'default', value: id } as FieldAttributeDefault);
              }
            } else if ((dch as any)['callExpr']) {
              const call = (dch['callExpr'] as CstNode[])[0];
              const cch = call.children as CstChildrenDictionary;
              const fn = (cch['Identifier'] as IToken[])[0].image;
              const args: Array<string | number | boolean> = [];
              if (cch['literal']) {
                for (const lit of cch['literal'] as CstNode[]) {
                  const lch = lit.children as CstChildrenDictionary;
                  if (lch['NumberLiteral']) args.push(Number((lch['NumberLiteral'] as IToken[])[0].image));
                  else if (lch['StringLiteral']) args.push((lch['StringLiteral'] as IToken[])[0].image.slice(1, -1));
                  else if (lch['Identifier']) {
                    const v = (lch['Identifier'] as IToken[])[0].image;
                    args.push(v === 'true' ? true : v === 'false' ? false : v);
                  }
                }
              }
              attributes.push({ kind: 'default', value: { call: fn, args } } as FieldAttributeDefault);
            } else if (agCh['mapAttr']) {
              const mapNode = (agCh['mapAttr'] as CstNode[])[0];
              const mch = mapNode.children as CstChildrenDictionary;
              const to = (mch['StringLiteral'] as IToken[])[0].image.slice(1, -1);
              attributes.push({ kind: 'map', to } as FieldAttributeMap);
            }
          }
        }
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
        const attributes: FieldAttribute[] = [];
        const attrGroups = (rch['fieldAttributeGroup'] as CstNode[]) || [];
        for (const ag of attrGroups) {
          const agCh = ag.children as CstChildrenDictionary;
          if (agCh['Unique']) attributes.push({ kind: 'unique' });
        }
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
