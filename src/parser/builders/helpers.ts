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
    const origin = (ag as any).name === 'fieldAnnotation' ? 'annotation' : 'paren';
  // Annotation nodes reuse inner tokens without parentheses; treat similarly
  if (agCh['Unique']) {
  attributes.push(Object.assign({ kind: 'unique' } as FieldAttributeUnique, { __origin: origin } as any));
    } else if (agCh['mapAttr'] || agCh['mapAnn']) {
      const mapNode = (agCh['mapAttr'] as CstNode[])[0];
      const mch = mapNode.children as CstChildrenDictionary;
      const to = (mch['StringLiteral'] as IToken[])[0].image.slice(1, -1);
  attributes.push(Object.assign({ kind: 'map', to } as FieldAttributeMap, { __origin: origin } as any));
    } else if (agCh['defaultAttr'] || agCh['defaultAnn']) {
      const defNode = (agCh['defaultAttr'] || agCh['defaultAnn'] as any)[0];
      const dch = (defNode as any).children as CstChildrenDictionary;
      let work = dch;
      if (dch['annotationValueList']) {
        work = ((dch['annotationValueList'] as any)[0] as any).children as CstChildrenDictionary;
      }
      if (work['NumberLiteral']) {
  attributes.push(Object.assign({ kind: 'default', value: Number((work['NumberLiteral'] as IToken[])[0].image) } as FieldAttributeDefault, { __origin: origin } as any));
      } else if (work['StringLiteral']) {
  attributes.push(Object.assign({ kind: 'default', value: (work['StringLiteral'] as IToken[])[0].image.slice(1, -1) } as FieldAttributeDefault, { __origin: origin } as any));
      } else if (work['Identifier']) {
        const id = (work['Identifier'] as IToken[])[0].image;
        if (id === 'true' || id === 'false') {
          attributes.push(Object.assign({ kind: 'default', value: id === 'true' } as FieldAttributeDefault, { __origin: origin } as any));
        } else {
          attributes.push(Object.assign({ kind: 'default', value: id } as FieldAttributeDefault, { __origin: origin } as any));
        }
      } else if ((work as any)['callExpr']) {
        const call = (work['callExpr'] as CstNode[])[0];
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
  attributes.push(Object.assign({ kind: 'default', value: { call: fn, args } } as FieldAttributeDefault, { __origin: origin } as any));
  }
  } else if (agCh['policyAttr'] || agCh['policyAnn']) {
      const polNode = (agCh['policyAttr'] as CstNode[])[0];
      const pch = polNode.children as CstChildrenDictionary;
      const valTok = (pch['Identifier'] as IToken[])[0];
  attributes.push(Object.assign({ kind: 'policy', value: valTok.image } as any, { __origin: origin }));
    }
  }
  return attributes;
}

export function collectRelationAttributes(attrGroups: CstNode[]): FieldAttribute[] {
  const attrs: FieldAttribute[] = [];
  for (const ag of attrGroups) {
    const agCh = (ag.children as CstChildrenDictionary);
  if (agCh['Unique']) attrs.push(Object.assign({ kind: 'unique' } as FieldAttributeUnique, { __origin: (ag as any).name === 'fieldAnnotation' ? 'annotation':'paren' } as any));
    else if (agCh['policyAttr']) {
      const polNode = (agCh['policyAttr'] as CstNode[])[0];
      const pch = polNode.children as CstChildrenDictionary;
      const valTok = (pch['Identifier'] as IToken[])[0];
  attrs.push(Object.assign({ kind: 'policy', value: valTok.image } as any, { __origin: (ag as any).name === 'fieldAnnotation' ? 'annotation':'paren' }));
    }
  }
  return attrs;
}
