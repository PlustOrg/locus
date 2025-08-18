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
// Preprocess no longer needed; grammar covers features.
import { UINode, ElementNode, TextNode, UIAttr } from './uiAst';

function _getText(tok?: IToken | IToken[]): string | undefined {
  if (!tok) return undefined;
  if (Array.isArray(tok)) return tok[0]?.image;
  return tok.image;
}

export function buildDatabaseAst(cst: CstNode, originalSource?: string, filePath?: string): LocusFileAST {
  const databases: DatabaseBlock[] = [];
  const designSystems: DesignSystemBlock[] = [];
  const pages: any[] = [];
  const components: any[] = [];
  const stores: any[] = [];

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
  const nameTok = (entChildren['Identifier'] as IToken[])[0];
  const name = nameTok.image;
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

  const entity: any = { name, fields, relations };
  defineHidden(entity, 'nameLoc', posOf(nameTok));
  entities.push(entity);
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

    // page/component/store using CST
    const pageNodes = (blkCh['pageBlock'] as CstNode[]) || [];
    for (const pn of pageNodes) {
      const ch = pn.children as CstChildrenDictionary;
  const nameTok = (ch['Identifier'] as IToken[])[0];
  const name = nameTok.image;
  const page: any = { type: 'page', name };
  defineHidden(page, 'nameLoc', posOf(nameTok));
      enrichPageFromCst(page, pn, originalSource || '');
      pages.push(page);
    }
    const compNodes = (blkCh['componentBlock'] as CstNode[]) || [];
    for (const cn of compNodes) {
      const ch = cn.children as CstChildrenDictionary;
  const nameTok = (ch['Identifier'] as IToken[])[0];
  const name = nameTok.image;
  const comp: any = { type: 'component', name };
  defineHidden(comp, 'nameLoc', posOf(nameTok));
      enrichComponentFromCst(comp, cn, originalSource || '');
      components.push(comp);
    }
    const storeNodes = (blkCh['storeBlock'] as CstNode[]) || [];
    for (const sn of storeNodes) {
      const ch = sn.children as CstChildrenDictionary;
  const nameTok = (ch['Identifier'] as IToken[])[0];
  const name = nameTok.image;
  const store: any = { type: 'store', name };
  defineHidden(store, 'nameLoc', posOf(nameTok));
      enrichStoreFromCst(store, sn, originalSource || '');
      stores.push(store);
    }
  }

  // No regex fallback; CST extraction is now authoritative.

  const ast: LocusFileAST = { databases, designSystems, pages, components, stores };
  if (filePath) defineHidden(ast as any, 'sourceFile', filePath);
  return ast;
}

// Regex-based enrichers removed; replaced by CST-driven enrichers below.

function enrichPageFromCst(node: any, cst: CstNode, source: string) {
  const ch = cst.children as CstChildrenDictionary;
  // state
  const stateBlocks = (ch['stateBlock'] as CstNode[]) || [];
  if (stateBlocks.length) {
  const raw = (stateBlocks[0].children as CstChildrenDictionary)['rawContent'] as CstNode[] | undefined;
  const inner = raw?.[0] ? sliceFrom(raw[0], source) : '';
  node.state = parseStateDecls(inner);
  }
  // on load
  const onLoads = (ch['onLoadBlock'] as CstNode[]) || [];
  if (onLoads.length) {
    const raw = (onLoads[0].children as CstChildrenDictionary)['rawContent'] as CstNode[];
    node.onLoad = raw?.[0] ? sliceFrom(raw[0], source) : '';
  }
  // actions
  node.actions = [];
  const actions = (ch['actionDecl'] as CstNode[]) || [];
  for (const a of actions) {
    const ach = a.children as CstChildrenDictionary;
  const ids = (ach['Identifier'] as IToken[]) || [];
  const name = ids[0]?.image;
  // extract only parameter identifiers (odd: includes name first, so slice)
  const params = ids.slice(1).map(t => t.image);
    const raw = (ach['rawContent'] as CstNode[]) || [];
    const body = raw[0] ? sliceFrom(raw[0], source) : '';
    node.actions.push({ name, params, body });
  }
  // ui
  const uis = (ch['uiBlock'] as CstNode[]) || [];
  if (uis.length) {
    const uch = uis[0].children as CstChildrenDictionary;
    const raw = (uch['rawContent'] as CstNode[]) || [];
    const inner = raw[0] ? sliceFrom(raw[0], source) : '';
    node.ui = `ui {${inner}}`;
    node.uiAst = parseUi(inner);
  }
}

function enrichComponentFromCst(node: any, cst: CstNode, source: string) {
  const ch = cst.children as CstChildrenDictionary;
  // params
  const params: any[] = [];
  const decls = (ch['paramDecl'] as CstNode[]) || [];
  for (const d of decls) {
    const dch = d.children as CstChildrenDictionary;
    const ids = (dch['Identifier'] as IToken[]) || [];
    const name = ids[0]?.image;
    // extract type from nested typeNameFeature
    const tfNodes = ((dch['typeNameFeature'] as CstNode[]) || (dch['typeNameFeature1'] as CstNode[]) || []) as CstNode[];
    let typeName: string | undefined;
    if (tfNodes.length) {
      const tfch = tfNodes[0].children as CstChildrenDictionary;
      if (tfch['Identifier']) typeName = (tfch['Identifier'] as IToken[])[0].image;
      else if (tfch['StringT']) typeName = 'String';
      else if (tfch['TextT']) typeName = 'Text';
      else if (tfch['IntegerT']) typeName = 'Integer';
      else if (tfch['DecimalT']) typeName = 'Decimal';
      else if (tfch['BooleanT']) typeName = 'Boolean';
      else if (tfch['DateTimeT']) typeName = 'DateTime';
      else if (tfch['JsonT']) typeName = 'Json';
    }
    const isList = !!dch['List'];
    const optional = !!dch['Question'];
    const type: any = isList ? { kind: 'list', of: typeName } : { kind: 'primitive', name: typeName };
    if (optional) type.optional = true;
    const defaultRaw = (dch['rawContent'] as CstNode[] | undefined)?.[0];
    const def = defaultRaw ? sliceFrom(defaultRaw, source) : undefined;
    params.push({ name, type, default: def });
  }
  if (params.length) node.params = params;
  // ui
  const uis = (ch['uiBlock'] as CstNode[]) || [];
  if (uis.length) {
    const uch = uis[0].children as CstChildrenDictionary;
    const raw = (uch['rawContent'] as CstNode[]) || [];
    const inner = raw[0] ? sliceFrom(raw[0], source) : '';
    node.ui = `ui {${inner}}`;
    node.uiAst = parseUi(inner);
  }
}

function enrichStoreFromCst(node: any, cst: CstNode, source: string) {
  const ch = cst.children as CstChildrenDictionary;
  const stateBlocks = (ch['stateBlock'] as CstNode[]) || [];
  if (stateBlocks.length) {
  const raw = (stateBlocks[0].children as CstChildrenDictionary)['rawContent'] as CstNode[] | undefined;
  const inner = raw?.[0] ? sliceFrom(raw[0], source) : '';
  node.state = parseStateDecls(inner);
  }
  const actions = (ch['actionDecl'] as CstNode[]) || [];
  if (actions.length) {
    node.actions = [];
    for (const a of actions) {
      const ach = a.children as CstChildrenDictionary;
      const ids = (ach['Identifier'] as IToken[]) || [];
      const name = ids[0]?.image;
      const params = ids.slice(1).map(t => t.image);
      const raw = (ach['rawContent'] as CstNode[]) || [];
      const body = raw[0] ? sliceFrom(raw[0], source) : '';
      node.actions.push({ name, params, body });
    }
  }
  // support bare store variables without a 'state { }' block
  if (!node.state) {
    const raws = (ch['rawContent'] as CstNode[]) || [];
    if (raws.length) {
      const body = raws.map(r => sliceFrom(r, source)).join('\n');
      const state = parseStateDecls(body);
      if (state.length) node.state = state;
    }
  }
}

function sliceFrom(node: CstNode, source: string): string {
  const tokens = collectTokens(node);
  if (!tokens.length) return '';
  const start = Math.min(...tokens.map(t => (t.startOffset ?? 0)));
  const end = Math.max(...tokens.map(t => (t.endOffset ?? t.startOffset ?? 0)));
  return source.slice(start, end + 1);
}

function collectTokens(node: CstNode): IToken[] {
  const out: IToken[] = [];
  const ch = node.children as CstChildrenDictionary;
  for (const key of Object.keys(ch)) {
    const arr = (ch as any)[key] as Array<IToken | CstNode>;
    if (!Array.isArray(arr)) continue;
    if (!arr.length) continue;
    if ((arr[0] as any).image !== undefined) {
      out.push(...(arr as IToken[]));
    } else {
      for (const n of arr as CstNode[]) out.push(...collectTokens(n));
    }
  }
  return out;
}

function posOf(tok: IToken | undefined): { line: number; column: number } | undefined {
  if (!tok) return undefined;
  const line = (tok.startLine ?? 1);
  const column = (tok.startColumn ?? 1);
  return { line, column };
}

function defineHidden(obj: any, key: string, value: any) {
  Object.defineProperty(obj, key, { value, enumerable: false, configurable: true, writable: true });
}

function _enrichComponent(node: any, body: string) {
  // params
  const params: any[] = [];
  const paramRe = /\bparam\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^=\n]+?)(?:\s*=\s*([^\n]+))?(?=\n|$)/g;
  let m: RegExpExecArray | null;
  while ((m = paramRe.exec(body)) !== null) {
    const name = m[1];
    let typeStr = m[2].trim();
    const defVal = m[3]?.trim();
    let optional = false;
    if (typeStr.endsWith('?')) { optional = true; typeStr = typeStr.slice(0, -1).trim(); }
    const listMatch = /^list\s+of\s+([A-Za-z_][A-Za-z0-9_]*)$/.exec(typeStr);
    let type: any;
    if (listMatch) type = { kind: 'list', of: listMatch[1] };
    else type = { kind: 'primitive', name: typeStr };
    if (optional) type.optional = true;
    params.push({ name, type, default: defVal });
  }
  if (params.length) node.params = params;
  // ui
  const uiBlk = extractUiBlock(body);
  if (uiBlk) {
    node.ui = uiBlk.full;
    node.uiAst = parseUi(uiBlk.inner);
  }
  else {
    node.ui = body;
  }
}

function _enrichStore(node: any, body: string) {
  node.state = parseStateDecls(body);
}

function parseStateDecls(src: string) {
  const lines = src.split(/\n|;+/).map(s => s.trim()).filter(Boolean);
  const out: any[] = [];
  for (const line of lines) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^=]+?)\s*=\s*([\s\S]+)$/.exec(line);
    if (!m) continue;
    const name = m[1];
    let typeStr = m[2].trim();
    const def = m[3];
    // Optional marker support (e.g., String? or list of X?)
    let optional = false;
    if (typeStr.endsWith('?')) { optional = true; typeStr = typeStr.slice(0, -1).trim(); }
    const listMatch = /^list\s+of\s+([A-Za-z_][A-Za-z0-9_]*)$/.exec(typeStr);
    if (listMatch) {
      const of = listMatch[1];
      const type = { kind: 'list', of } as any;
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

function parseUi(src: string): UINode {
  // Minimal parser: supports single root element with nested elements and text.
  // Attributes: size="str", attr={expr}, on:evt={expr}, for:each={item in items}
  const stack: ElementNode[] = [];
  let i = 0;
  let root: ElementNode | null = null;
  while (i < src.length) {
    if (src[i] === '<') {
      if (src[i + 1] === '/') {
        // closing
  const end = src.indexOf('>', i + 2);
  if (end === -1) { i++; continue; }
  const _tag = src.slice(i + 2, end).trim();
        const node = stack.pop();
        i = end + 1;
        if (!stack.length && node) root = node;
      } else {
        // opening or self-close
  const end = src.indexOf('>', i + 1);
  if (end === -1) { i++; continue; }
        const raw = src.slice(i + 1, end);
        const selfClose = raw.endsWith('/');
        const parts = raw.replace(/\/\s*$/, '').trim().split(/\s+/);
  const tag = parts.shift() as string;
  const attrs = parseAttrs(raw.slice(tag.length));
    const el: ElementNode = { type: 'element', tag, attrs, children: [] };
  if (stack.length) stack[stack.length - 1].children.push(el);
        stack.push(el);
        i = end + 1;
        if (selfClose) {
          stack.pop();
          if (!stack.length) root = el;
        }
      }
    } else {
      // text node
      const next = src.indexOf('<', i);
      const text = src.slice(i, next === -1 ? src.length : next);
      if (text.trim()) {
        const tn: TextNode = { type: 'text', value: text.trim() };
        if (stack.length) stack[stack.length - 1].children.push(tn);
      }
      i = next === -1 ? src.length : next;
    }
  }
  const built = (root as any) || ({ type: 'text', value: src } as TextNode);
  // Post-process element tree into structured control-flow nodes
  return transformUiTreeToStructured(built);
}

function parseAttrs(src: string): Record<string, UIAttr> {
  const attrs: Record<string, UIAttr> = {};
  // on:evt={...} or name={...} or name="..." or for:each={item in items}
  const re = /(for:each|on:[A-Za-z]+|[A-Za-z_:][A-Za-z0-9_:.-]*)\s*=\s*(\{[^}]*\}|"[^"]*"|[^\s>]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const key = m[1];
    const val = m[2];
    if (key === 'for:each' && /^\{\s*([A-Za-z_][A-Za-z0-9_]*)\s+in\s+([\s\S]+)\}$/.test(val)) {
      const mm = /\{\s*([A-Za-z_][A-Za-z0-9_]*)\s+in\s+([\s\S]+)\}/.exec(val)!;
      attrs['forEach'] = { kind: 'forEach', item: mm[1], iterable: mm[2].trim() } as any;
    } else if (val.startsWith('"')) {
      attrs[normalizeAttrKey(key)] = { kind: 'string', value: val.slice(1, -1) };
    } else if (val.startsWith('{') && val.endsWith('}')) {
      attrs[normalizeAttrKey(key)] = { kind: 'expr', value: val.slice(1, -1).trim() };
    } else {
      attrs[normalizeAttrKey(key)] = { kind: 'string', value: val };
    }
  }
  return attrs;
}

function normalizeAttrKey(k: string): string {
  if (k.startsWith('on:')) {
    const ev = k.slice(3);
    return 'on' + ev.charAt(0).toUpperCase() + ev.slice(1);
  }
  if (k === 'bind:value') return 'bindValue';
  return k.replace(':', '');
}

function extractUiBlock(src: string): { full: string; inner: string } | null {
  const uiIdx = src.search(/\bui\s*\{/);
  if (uiIdx === -1) return null;
  // find the first '{' after 'ui'
  const braceIdx = src.indexOf('{', uiIdx);
  if (braceIdx === -1) return null;
  let depth = 1;
  let i = braceIdx + 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  if (depth !== 0) return null;
  const end = i; // position after matching '}'
  const full = src.slice(uiIdx, end);
  const inner = src.slice(braceIdx + 1, end - 1);
  return { full, inner };
}

function transformUiTreeToStructured(node: any): UINode {
  if (!node || node.type !== 'element') return node as UINode;
  // Handle for:each on elements
  if ((node.attrs as any)?.forEach?.kind === 'forEach') {
    const fe = (node.attrs as any).forEach;
    const template = { ...node, attrs: Object.fromEntries(Object.entries(node.attrs).filter(([k]) => k !== 'forEach')) };
    return { type: 'forEach', item: fe.item, iterable: fe.iterable, template } as any;
  }
  // Handle if/elseif/else sibling chains under this element
  node.children = (node.children || []).map((c: any) => transformUiTreeToStructured(c));
  const children: any[] = node.children || [];
  const newChildren: any[] = [];
  for (let i = 0; i < children.length; i++) {
    const cur = children[i];
    if (cur.type === 'element' && cur.tag === 'if') {
      const cond = (cur.attrs?.condition?.value) || 'false';
      const consequent = (cur.children || []).map((x: any) => transformUiTreeToStructured(x));
      const ifNode: any = { type: 'if', condition: cond, consequent };
      i++;
      // collect elseif/else
      while (i < children.length) {
        const nxt = children[i];
        if (nxt.type === 'element' && nxt.tag === 'elseif') {
          const ec = (nxt.attrs?.condition?.value) || 'false';
          const eb = (nxt.children || []).map((x: any) => transformUiTreeToStructured(x));
          ifNode.elif = ifNode.elif || [];
          ifNode.elif.push({ condition: ec, children: eb });
          i++;
        } else if (nxt.type === 'element' && nxt.tag === 'else') {
          ifNode.else = (nxt.children || []).map((x: any) => transformUiTreeToStructured(x));
          i++;
          break;
        } else break;
      }
      newChildren.push(ifNode);
      i--; // compensate for loop increment
    } else {
      newChildren.push(cur);
    }
  }
  node.children = newChildren;
  return node as UINode;
}
