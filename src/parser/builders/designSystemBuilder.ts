import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { DesignSystemBlock } from '../../ast';
import { posOf } from '../builderUtils';

export function buildDesignSystemBlocks(dsNodes: CstNode[]): DesignSystemBlock[] {
  const designSystems: DesignSystemBlock[] = [];
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
          const lit = (ach['StringLiteral'] as IToken[] | undefined) || (ach['HexColor'] as IToken[] | undefined) || (ach['NumberLiteral'] as IToken[] | undefined);
          const valTok = lit![0];
          let val: string;
          if (valTok.tokenType.name === 'StringLiteral') val = valTok.image.slice(1, -1);
          else val = valTok.image;
          dsc.colors[themeName][key] = { value: val, loc: posOf(valTok) } as any;
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
        if (key === 'fontFamily') {
          dsc.typography.fontFamily = valStr;
        } else if (key === 'baseSize') {
          dsc.typography.baseSize = { value: valStr, loc: posOf(valTok) };
        }
      }
      const weightsBlocks = (tbc['weightsBlock'] as CstNode[]) || [];
      for (const wb of weightsBlocks) {
        const wbc = wb.children as CstChildrenDictionary;
        const wToks = (wbc['tokenAssignment'] as CstNode[]) || [];
        dsc.typography.weights = dsc.typography.weights || {};
        for (const ta of wToks) {
          const ach = ta.children as CstChildrenDictionary;
            const key = (ach['Identifier'] as IToken[])[0].image;
            const numTok = (ach['NumberLiteral'] as IToken[])[0];
            dsc.typography.weights[key] = { value: Number(numTok.image), loc: posOf(numTok) };
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
          const lit = (ach['StringLiteral'] as IToken[] | undefined) || (ach['HexColor'] as IToken[] | undefined) || (ach['NumberLiteral'] as IToken[] | undefined);
          const valTok = lit![0];
          let val: string;
          if (valTok.tokenType.name === 'StringLiteral') val = valTok.image.slice(1, -1); else val = valTok.image;
          (dsc as any)[prop][key] = { value: val, loc: posOf(valTok) };
        }
      }
    }

    designSystems.push(dsc);
  }
  return designSystems;
}
