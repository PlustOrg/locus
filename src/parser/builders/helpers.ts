import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { FieldAttribute, FieldAttributeDefault, FieldAttributeMap, FieldAttributeUnique, FieldType } from '../../ast';

export function mapPrimitiveToken(key: string): FieldType['name'] {
  switch (key) {
    case 'StringT': return 'String';
    case 'TextT': return 'Text';
    case 'IntegerT': return 'Integer';
    case 'DecimalT': return 'Decimal';
    case 'BooleanT': return 'Boolean';
    case 'DateTimeT': return 'DateTime';
    case 'JsonT': return 'Json';
  case 'BigIntT': return 'BigInt';
  case 'FloatT': return 'Float';
  case 'UUIDT': return 'UUID';
  case 'EmailT': return 'Email';
  case 'URLT': return 'URL';
    default: return 'String';
  }
}

export function collectFieldAttributes(attrGroups: CstNode[]): FieldAttribute[] {
  const attributes: FieldAttribute[] = [];
  for (const ag of attrGroups) {
    const agCh = ag.children as CstChildrenDictionary;
    if (agCh['Unique']) {
      attributes.push({ kind: 'unique' } as FieldAttributeUnique);
    } else if (agCh['mapAttr']) {
      const mapNode = (agCh['mapAttr'] as CstNode[])[0];
      const mch = mapNode.children as CstChildrenDictionary;
      const to = (mch['StringLiteral'] as IToken[])[0].image.slice(1, -1);
      attributes.push({ kind: 'map', to } as FieldAttributeMap);
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
  }
    } else if (agCh['policyAttr']) {
      const polNode = (agCh['policyAttr'] as CstNode[])[0];
      const pch = polNode.children as CstChildrenDictionary;
      const valTok = (pch['Identifier'] as IToken[])[0];
      attributes.push({ kind: 'policy', value: valTok.image } as any);
    }
  }
  return attributes;
}

export function collectRelationAttributes(attrGroups: CstNode[]): FieldAttribute[] {
  const attrs: FieldAttribute[] = [];
  for (const ag of attrGroups) {
    const agCh = (ag.children as CstChildrenDictionary);
    if (agCh['Unique']) attrs.push({ kind: 'unique' } as FieldAttributeUnique);
    else if (agCh['policyAttr']) {
      const polNode = (agCh['policyAttr'] as CstNode[])[0];
      const pch = polNode.children as CstChildrenDictionary;
      const valTok = (pch['Identifier'] as IToken[])[0];
      attrs.push({ kind: 'policy', value: valTok.image } as any);
    }
  }
  return attrs;
}
