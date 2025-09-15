import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { sliceFromCst } from '../cstText';

/** Parse inline (raw) state declarations from a body string. Pure. */
export function parseStateDecls(body: string) {
  const lines = body.split(/\n|;+?/).map(s => s.trim()).filter(Boolean);
  const out: any[] = [];
  for (const line of lines) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^=]+?)\s*=\s*([\s\S]+)$/.exec(line);
    if (!m) continue;
    const name = m[1];
    let typeStr = m[2].trim();
    const def = m[3];
    let optional = false;
    if (typeStr.endsWith('?')) { optional = true; typeStr = typeStr.slice(0, -1).trim(); }
    const listMatch = /^list\s+of\s+([A-Za-z_][A-Za-z0-9_]*)$/.exec(typeStr);
    if (listMatch) {
      const of = listMatch[1];
      const type: any = { kind: 'list', of };
      if (optional) type.optional = true;
      out.push({ name, type, default: def });
    } else {
      const type: any = { kind: 'primitive', name: typeStr };
      if (optional) type.optional = true;
      out.push({ name, type, default: def });
    }
  }
  return out;
}

/** Parse a structured stateDecl CST node list into state entries. */
export function parseStructuredStateDecls(nodes: CstNode[]): any[] {
  return nodes.map(sd => {
    const sdch = sd.children as CstChildrenDictionary;
    const nameTok = (sdch['Identifier'] as IToken[])[0];
    const typeAlt = (sdch['typeNameFeature'] as CstNode[])[0];
    let typeName = 'String';
    if (typeAlt) {
      const tfc = typeAlt.children as CstChildrenDictionary;
      if (tfc['Identifier']) typeName = (tfc['Identifier'] as IToken[])[0].image;
      else if (tfc['IntegerT']) typeName = 'Integer';
      else if (tfc['BooleanT']) typeName = 'Boolean';
      else if (tfc['TextT']) typeName = 'Text';
    }
    let type: any;
    if (sdch['List']) type = { kind: 'list', of: typeName }; else type = { kind: 'primitive', name: typeName };
    if (sdch['Question']) type.optional = true;
    let defTok: IToken | undefined;
    if (sdch['StringLiteral']) defTok = (sdch['StringLiteral'] as IToken[])[0];
    else if (sdch['NumberLiteral']) defTok = (sdch['NumberLiteral'] as IToken[])[0];
    else if (sdch['Identifier']) defTok = (sdch['Identifier'] as IToken[]).slice(-1)[0];
    let def: string | undefined;
    if (sdch['LBracketTok'] && sdch['RBracketTok']) def = '[]'; else def = defTok ? defTok.image : 'undefined';
    return { name: nameTok.image, type, default: def };
  });
}

/** Given a stateBlock CST node, return its parsed state array using structured or raw parsing. */
export function parseStateBlockNode(stateBlock: CstNode, originalSource: string): any[] {
  const sbch = stateBlock.children as CstChildrenDictionary;
  const structured = (sbch['stateDecl'] as CstNode[]) || [];
  if (structured.length) return parseStructuredStateDecls(structured);
  const raw = (sbch['rawContent'] as CstNode[] | undefined);
  const inner = raw?.[0] ? sliceFromCst(raw[0], originalSource) : '';
  return parseStateDecls(inner);
}
