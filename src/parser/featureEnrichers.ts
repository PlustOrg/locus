import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';
import { parseUi } from './astBuilder';

function sliceFrom(node: CstNode, source: string): string {
  const loc: any = (node as any).location;
  if (!loc) return '';
  const start = loc.startOffset;
  const end = loc.endOffset + 1;
  return source.slice(start, end);
}

function parseStateDecls(inner: string): any {
  // existing logic preserved (placeholder minimal)
  const lines = inner.split(/\n/).map(l => l.trim()).filter(Boolean);
  const out: any = {};
  for (const l of lines) {
    const m = l.match(/^(\w+):\s*(\w+)(?:\s*=\s*(.+))?$/);
    if (m) out[m[1]] = { type: m[2], default: m[3] };
  }
  return out;
}

export function enrichPageFromCst(node: any, cst: CstNode, source: string) {
  const ch = cst.children as CstChildrenDictionary;
  const stateBlocks = (ch['stateBlock'] as CstNode[]) || [];
  if (stateBlocks.length) {
    const raw = (stateBlocks[0].children as CstChildrenDictionary)['rawContent'] as CstNode[] | undefined;
    const inner = raw?.[0] ? sliceFrom(raw[0], source) : '';
    node.state = parseStateDecls(inner);
  }
  const onLoads = (ch['onLoadBlock'] as CstNode[]) || [];
  if (onLoads.length) {
    const raw = (onLoads[0].children as CstChildrenDictionary)['rawContent'] as CstNode[];
    node.onLoad = raw?.[0] ? sliceFrom(raw[0], source) : '';
  }
  node.actions = [];
  const actions = (ch['actionDecl'] as CstNode[]) || [];
  for (const a of actions) {
    const ach = a.children as CstChildrenDictionary;
    const ids = (ach['Identifier'] as IToken[]) || [];
    const name = ids[0]?.image;
    const params = ids.slice(1).map(t => t.image);
    const raw = (ach['rawContent'] as CstNode[]) || [];
    const body = raw[0] ? sliceFrom(raw[0], source) : '';
    node.actions.push({ name, params, body });
  }
  const uis = (ch['uiBlock'] as CstNode[]) || [];
  if (uis.length) {
    const uch = uis[0].children as CstChildrenDictionary;
    const raw = (uch['rawContent'] as CstNode[]) || [];
    const inner = raw[0] ? sliceFrom(raw[0], source) : '';
    node.ui = `ui {${inner}}`;
    node.uiAst = parseUi(inner);
  }
}

export function enrichComponentFromCst(node: any, cst: CstNode, source: string) {
  const ch = cst.children as CstChildrenDictionary;
  const params: any[] = [];
  const decls = (ch['paramDecl'] as CstNode[]) || [];
  for (const d of decls) {
    const dch = d.children as CstChildrenDictionary;
    const ids = (dch['Identifier'] as IToken[]) || [];
    const name = ids[0]?.image;
    params.push({ name });
  }
  node.params = params;
  const stateBlocks = (ch['stateBlock'] as CstNode[]) || [];
  if (stateBlocks.length) {
    const raw = (stateBlocks[0].children as CstChildrenDictionary)['rawContent'] as CstNode[] | undefined;
    const inner = raw?.[0] ? sliceFrom(raw[0], source) : '';
    node.state = parseStateDecls(inner);
  }
  const styleOverrides = (ch['styleOverrideBlock'] as CstNode[]) || [];
  if (styleOverrides.length) {
    const raw = (styleOverrides[0].children as CstChildrenDictionary)['rawContent'] as CstNode[] | undefined;
    const inner = raw?.[0] ? sliceFrom(raw[0], source) : '';
    node.styleOverride = inner.trim();
  }
  const uiBlocks = (ch['uiBlock'] as CstNode[]) || [];
  if (uiBlocks.length) {
    const uch = uiBlocks[0].children as CstChildrenDictionary;
    const raw = (uch['rawContent'] as CstNode[]) || [];
    const inner = raw[0] ? sliceFrom(raw[0], source) : '';
    node.ui = `ui {${inner}}`;
    node.uiAst = parseUi(inner);
  }
}

export function enrichStoreFromCst(node: any, cst: CstNode, source: string) {
  const ch = cst.children as CstChildrenDictionary;
  const stateBlocks = (ch['stateBlock'] as CstNode[]) || [];
  if (stateBlocks.length) {
    const raw = (stateBlocks[0].children as CstChildrenDictionary)['rawContent'] as CstNode[] | undefined;
    const inner = raw?.[0] ? sliceFrom(raw[0], source) : '';
    node.state = parseStateDecls(inner);
  }
}
