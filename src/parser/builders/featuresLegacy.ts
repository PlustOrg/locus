import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { PageBlock, ComponentBlock, StoreBlock } from '../../ast';
import { posOf, defineHidden } from '../builderUtils';
import { parseUi } from '../uiParser';
import { sliceFromCst } from '../cstText';

// Wrapper preserving original local function name to avoid larger diff; delegates to shared helper.
function sliceFrom(node: CstNode, source: string): string { return sliceFromCst(node, source); }

function parseStateDecls(body: string) {
  const lines = body.split(/\n|;+/).map(s => s.trim()).filter(Boolean);
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

export function buildFeatureBlocksLegacy(pageNodes: CstNode[], compNodes: CstNode[], storeNodes: CstNode[], originalSource: string) {
  const pages: PageBlock[] = [];
  const components: ComponentBlock[] = [];
  const stores: StoreBlock[] = [];

  for (const pn of pageNodes) {
    const ch = pn.children as CstChildrenDictionary;
    const nameTok = (ch['Identifier'] as IToken[])[0];
    const page: any = { type: 'page', name: nameTok.image };
    defineHidden(page, 'nameLoc', posOf(nameTok));
    if (ch['guardClause']) {
      const gc = (ch['guardClause'] as CstNode[])[0];
      const gch = gc.children as CstChildrenDictionary;
      // New grammar uses explicit Guard token + Identifier role
      const roleIds = (gch['Identifier'] as IToken[]) || [];
      if (roleIds.length >= 1) {
        page.guard = { role: roleIds[0].image };
      }
    }
    const stateBlocks = (ch['stateBlock'] as CstNode[]) || [];
    if (stateBlocks.length) {
      const sb = stateBlocks[0];
      const sbch = sb.children as CstChildrenDictionary;
      const structured = (sbch['stateDecl'] as CstNode[]) || [];
      if (structured.length) {
        page.state = structured.map(sd => {
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
          if (sdch['List']) type = { kind: 'list', of: typeName };
          else type = { kind: 'primitive', name: typeName };
          if (sdch['Question']) type.optional = true;
          // Default value token: prefer String/Number/Identifier first
          let defTok: IToken | undefined;
          if (sdch['StringLiteral']) defTok = (sdch['StringLiteral'] as IToken[])[0];
          else if (sdch['NumberLiteral']) defTok = (sdch['NumberLiteral'] as IToken[])[0];
          else if (sdch['Identifier']) defTok = (sdch['Identifier'] as IToken[]).slice(-1)[0];
          let def: string | undefined;
          if (sdch['LBracketTok'] && sdch['RBracketTok']) def = '[]';
          else def = defTok ? defTok.image : 'undefined';
          return { name: nameTok.image, type, default: def };
        });
      } else {
        const raw = (sbch['rawContent'] as CstNode[] | undefined);
        const inner = raw?.[0] ? sliceFrom(raw[0], originalSource) : '';
        page.state = parseStateDecls(inner);
      }
    }
    const onLoads = (ch['onLoadBlock'] as CstNode[]) || [];
    if (onLoads.length) {
      const raw = (onLoads[0].children as CstChildrenDictionary)['rawContent'] as CstNode[] | undefined;
      page.onLoad = raw?.[0] ? sliceFrom(raw[0], originalSource) : '';
    }
    page.actions = [];
    const actions = (ch['actionDecl'] as CstNode[]) || [];
    for (const a of actions) {
      const ach = a.children as CstChildrenDictionary;
      const ids = (ach['Identifier'] as IToken[]) || [];
      const name = ids[0]?.image;
  // Params only appear if parentheses provided; if omitted, no actionParam nodes.
  const params = ids.slice(1).map(t => t.image);
      const raw = (ach['rawContent'] as CstNode[]) || [];
      const body = raw[0] ? sliceFrom(raw[0], originalSource) : '';
      page.actions.push({ name, params, body });
    }
    const uis = (ch['uiBlock'] as CstNode[]) || [];
    if (uis.length) {
      const uch = uis[0].children as CstChildrenDictionary;
      const raw = (uch['rawContent'] as CstNode[]) || [];
      const inner = raw[0] ? sliceFrom(raw[0], originalSource) : '';
      page.ui = `ui {${inner}}`;
      page.uiAst = parseUi(inner);
    }
    pages.push(page);
  }

  for (const cn of compNodes) {
    const ch = cn.children as CstChildrenDictionary;
    const nameTok = (ch['Identifier'] as IToken[])[0];
    const comp: any = { type: 'component', name: nameTok.image };
    defineHidden(comp, 'nameLoc', posOf(nameTok));
    const decls = (ch['paramDecl'] as CstNode[]) || [];
    const params: any[] = [];
    for (const d of decls) {
      const dch = d.children as CstChildrenDictionary;
      const ids = (dch['Identifier'] as IToken[]) || [];
      const name = ids[0]?.image;
      const tf = (dch['typeNameFeature'] as CstNode[])[0];
      let typeName = 'String';
      if (tf) {
        const tfc = tf.children as CstChildrenDictionary;
        if (tfc['Identifier']) typeName = (tfc['Identifier'] as IToken[])[0].image;
        else if (tfc['IntegerT']) typeName = 'Integer';
        else if (tfc['BooleanT']) typeName = 'Boolean';
        else if (tfc['TextT']) typeName = 'Text';
      }
      let type: any;
      if (dch['List']) type = { kind: 'list', of: typeName };
      else type = { kind: 'primitive', name: typeName };
      if (dch['Question']) type.optional = true;
      const defRaw = (dch['rawContent'] as CstNode[] | undefined)?.[0];
      const def = defRaw ? sliceFrom(defRaw, originalSource) : undefined;
      params.push({ name, type, default: def });
    }
    if (params.length) comp.params = params;
    const uis = (ch['uiBlock'] as CstNode[]) || [];
    if (uis.length) {
      const uch = uis[0].children as CstChildrenDictionary;
      const raw = (uch['rawContent'] as CstNode[]) || [];
      const inner = raw[0] ? sliceFrom(raw[0], originalSource) : '';
      comp.ui = `ui {${inner}}`;
      comp.uiAst = parseUi(inner);
      // Infer params from UI expressions referencing undeclared identifiers
      if (comp.uiAst) {
        const inferred = new Set<string>();
        const walk = (n: any) => {
          if (n.type === 'expr' && typeof n.value === 'string') {
            const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(n.value)?.[0];
            if (id && !(comp.params||[]).some((p:any)=>p.name===id) && id !== 'children') inferred.add(id);
          }
          if (n.children) for (const c of n.children) walk(c);
        };
        walk(comp.uiAst);
        if (inferred.size) comp.inferredParams = Array.from(inferred).sort();
      }
    }
    components.push(comp);
  }

  for (const sn of storeNodes) {
    const ch = sn.children as CstChildrenDictionary;
    const nameTok = (ch['Identifier'] as IToken[])[0];
    const store: any = { type: 'store', name: nameTok.image };
    defineHidden(store, 'nameLoc', posOf(nameTok));
    const stateBlocks = (ch['stateBlock'] as CstNode[]) || [];
    if (stateBlocks.length) {
      const sb = stateBlocks[0];
      const sbch = sb.children as CstChildrenDictionary;
      const structured = (sbch['stateDecl'] as CstNode[]) || [];
      if (structured.length) {
        store.state = structured.map(sd => {
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
      } else {
        const raw = (sbch['rawContent'] as CstNode[] | undefined);
        const inner = raw?.[0] ? sliceFrom(raw[0], originalSource) : '';
        store.state = parseStateDecls(inner);
      }
    }
    if (!store.state) {
      const raws = (ch['rawContent'] as CstNode[]) || [];
      if (raws.length) {
        const body = raws.map(r => sliceFrom(r, originalSource)).join('\n');
        const state = parseStateDecls(body);
        if (state.length) store.state = state;
      }
    }
    stores.push(store);
  }

  return { pages, components, stores };
}
