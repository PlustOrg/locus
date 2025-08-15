import { CstNode, CstChildrenDictionary, IToken } from 'chevrotain';
import {
  DatabaseBlock,
  DesignSystemBlock,
  Entity,
  Field,
  FieldAttribute,
  FieldAttributeDefault,
  FieldAttributeMap,
  FieldAttributeUnique,
  FieldType,
  LocusFileAST,
  Relation,
} from '../ast';

function getText(tok?: IToken | IToken[]): string | undefined {
  if (!tok) return undefined;
  if (Array.isArray(tok)) return tok[0]?.image;
  return tok.image;
}

export function buildDatabaseAst(cst: CstNode): LocusFileAST {
  const databases: DatabaseBlock[] = [];
  const designSystems: DesignSystemBlock[] = [];

  const topChildren = cst.children as CstChildrenDictionary;
  const blocks = (topChildren['topLevel'] as CstNode[]) || [];

  for (const blk of blocks) {
    const blkCh = blk.children as CstChildrenDictionary;

    // database blocks
    const dbNodes = (blkCh['databaseBlock'] as CstNode[]) || [];
    for (const dbNode of dbNodes) {
      const entities: Entity[] = [];
      const dbBlockChildren = dbNode.children as CstChildrenDictionary;
      const entityDecls = (dbBlockChildren['entityDecl'] as CstNode[]) || [];
      for (const ent of entityDecls) {
        const entChildren = ent.children as CstChildrenDictionary;
        const name = (entChildren['Identifier'] as IToken[])[0].image;
        const fields: Field[] = [];
        const relations: Relation[] = [];

        const fieldDecls = (entChildren['fieldDecl'] as CstNode[]) || [];
        for (const fd of fieldDecls) {
          const fdCh = fd.children as CstChildrenDictionary;
          const fieldName = (fdCh['Identifier'] as IToken[])[0].image;

          const typeAlt = (fdCh['fieldType'] as CstNode[])[0];
          const typeCh = typeAlt.children as CstChildrenDictionary;
          const typeTokenName = Object.keys(typeCh).find(k => [
            'StringT','TextT','IntegerT','DecimalT','BooleanT','DateTimeT','JsonT'
          ].includes(k));
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
          const fieldType: any = { kind: 'primitive', name: mapName(typeTokenName!) } as FieldType;
          if (optional) fieldType.optional = true;

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
              } else if (dch['callExpr']) {
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
              }
            } else if (agCh['mapAttr']) {
              const mapNode = (agCh['mapAttr'] as CstNode[])[0];
              const mch = mapNode.children as CstChildrenDictionary;
              const to = (mch['StringLiteral'] as IToken[])[0].image.slice(1, -1);
              attributes.push({ kind: 'map', to } as FieldAttributeMap);
            }
          }

          fields.push({ name: fieldName, type: fieldType, attributes });
        }

        const relationDecls = (entChildren['relationDecl'] as CstNode[]) || [];
        for (const rd of relationDecls) {
          const rch = rd.children as CstChildrenDictionary;
          const relName = (rch['Identifier'] as IToken[])[0].image; // first identifier
          let kind: any = 'has_many';
          if (rch['BelongsTo']) kind = 'belongs_to';
          else if (rch['HasOne']) kind = 'has_one';
          else if (rch['HasMany']) kind = 'has_many';
          const targetTokens = rch['Identifier'] as IToken[];
          const target = targetTokens[targetTokens.length - 1].image;
          const attributes: FieldAttribute[] = [];

          const attrGroups = (rch['fieldAttributeGroup'] as CstNode[]) || [];
          for (const ag of attrGroups) {
            const agCh = ag.children as CstChildrenDictionary;
            if (agCh['Unique']) attributes.push({ kind: 'unique' });
          }

          relations.push({ name: relName, kind, target, attributes });
        }

        entities.push({ name, fields, relations });
      }
      databases.push({ type: 'database', entities });
    }

    // design_system blocks
    const dsNodes = (blkCh['designSystemBlock'] as CstNode[]) || [];
    for (const dsNode of dsNodes) {
      const dsc: DesignSystemBlock = { type: 'design_system' };
      const dsCh = dsNode.children as CstChildrenDictionary;

      const colorsBlocks = (dsCh['colorsBlock'] as CstNode[]) || [];
      for (const cb of colorsBlocks) {
        const cbCh = cb.children as CstChildrenDictionary;
        const themes = (cbCh['themeBlock'] as CstNode[]) || [];
        for (const th of themes) {
          const tch = th.children as CstChildrenDictionary;
          let themeName = '';
          if (tch['Identifier']) themeName = (tch['Identifier'] as IToken[])[0].image;
          else themeName = (tch['StringLiteral'] as IToken[])[0].image.slice(1, -1);
          dsc.colors = dsc.colors || {};
          dsc.colors[themeName] = dsc.colors[themeName] || {};
          const toks = (tch['tokenAssignment'] as CstNode[]) || [];
          for (const ta of toks) {
            const ach = ta.children as CstChildrenDictionary;
            const key = (ach['Identifier'] as IToken[])[0].image;
            const lit = (ach['StringLiteral'] as IToken[] | undefined) || (ach['NumberLiteral'] as IToken[] | undefined);
            const valTok = lit![0];
            const val = valTok.tokenType.name === 'StringLiteral' ? valTok.image.slice(1, -1) : valTok.image;
            dsc.colors[themeName][key] = val as any;
          }
        }
      }

      const typoBlocks = (dsCh['typographyBlock'] as CstNode[]) || [];
      for (const tb of typoBlocks) {
        dsc.typography = dsc.typography || { weights: {} };
        const tbc = tb.children as CstChildrenDictionary;
        const toks = (tbc['tokenAssignment'] as CstNode[]) || [];
        for (const ta of toks) {
          const ach = ta.children as CstChildrenDictionary;
          const key = (ach['Identifier'] as IToken[])[0].image;
          const lit = (ach['StringLiteral'] as IToken[] | undefined) || (ach['NumberLiteral'] as IToken[] | undefined);
          const valTok = lit![0];
          const valStr = valTok.tokenType.name === 'StringLiteral' ? valTok.image.slice(1, -1) : valTok.image;
          if (key === 'fontFamily') dsc.typography.fontFamily = valStr;
          else if (key === 'baseSize') dsc.typography.baseSize = valStr;
        }
        const weightsBlocks = (tbc['weightsBlock'] as CstNode[]) || [];
        for (const wb of weightsBlocks) {
          const wbc = wb.children as CstChildrenDictionary;
          const wToks = (wbc['tokenAssignment'] as CstNode[]) || [];
          dsc.typography.weights = dsc.typography.weights || {};
          for (const ta of wToks) {
            const ach = ta.children as CstChildrenDictionary;
            const key = (ach['Identifier'] as IToken[])[0].image;
            const num = (ach['NumberLiteral'] as IToken[])[0].image;
            dsc.typography.weights[key] = Number(num);
          }
        }
      }

      const simpleBlocks: Array<[keyof DesignSystemBlock, string]> = [
        ['spacing', 'spacingBlock'],
        ['radii', 'radiiBlock'],
        ['shadows', 'shadowsBlock'],
      ];
      for (const [prop, name] of simpleBlocks) {
        const arr = (dsCh[name] as CstNode[]) || [];
        for (const bl of arr) {
          (dsc as any)[prop] = (dsc as any)[prop] || {};
          const bc = bl.children as CstChildrenDictionary;
          const toks = (bc['tokenAssignment'] as CstNode[]) || [];
          for (const ta of toks) {
            const ach = ta.children as CstChildrenDictionary;
            const key = (ach['Identifier'] as IToken[])[0].image;
            const lit = (ach['StringLiteral'] as IToken[] | undefined) || (ach['NumberLiteral'] as IToken[] | undefined);
            const valTok = lit![0];
            const val = valTok.tokenType.name === 'StringLiteral' ? valTok.image.slice(1, -1) : valTok.image;
            (dsc as any)[prop][key] = val as any;
          }
        }
      }

      designSystems.push(dsc);
    }
  }

  return { databases, designSystems, pages: [], components: [], stores: [] };
}
