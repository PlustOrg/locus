import { UINode, ElementNode, TextNode, UIAttr, ExprNodeUI } from './uiAst';
import { parseExpression } from './expr';

// Phase 3: Slot syntax support <slot name="header"/> consumed via {slot.header}

export function parseUi(src: string): UINode {
  const stack: ElementNode[] = [];
  let i = 0;
  let root: ElementNode | null = null;
  while (i < src.length) {
    if (src[i] === '<') {
      if (src[i + 1] === '/') {
        const end = src.indexOf('>', i + 2);
        if (end === -1) { i++; continue; }
        const closed = stack.pop();
        i = end + 1;
        if (!stack.length && closed && !root) root = closed;
      } else {
        const end = src.indexOf('>', i + 1);
        if (end === -1) { i++; continue; }
        const raw = src.slice(i + 1, end);
        const selfClose = raw.endsWith('/');
        const tag = raw.replace(/\/.*/, '').trim().split(/\s+/)[0];
        if (tag === 'slot') {
          // minimal attribute parse for name
          const nm = /name\s*=\s*"([A-Za-z_][A-Za-z0-9_]*)"/.exec(raw);
          const name = nm ? nm[1] : 'default';
          const slotEl: any = { type: 'slot', name };
          if (stack.length) stack[stack.length - 1].children.push(slotEl);
          i = end + 1;
          if (!stack.length && !root) root = slotEl;
          continue;
        }
        const attrSrc = raw.slice(tag.length);
        const attrs = parseAttrs(attrSrc);
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
      const next = src.indexOf('<', i);
      const text = src.slice(i, next === -1 ? src.length : next);
      if (text.trim()) {
        // Split into literal and {expr} segments
        const parts: UINode[] = [];
        let last = 0;
        const reExpr = /\{([^{}]+)\}/g;
        let m: RegExpExecArray | null;
        while ((m = reExpr.exec(text)) !== null) {
          if (m.index > last) {
            const lit = text.slice(last, m.index).trim();
            if (lit) parts.push({ type: 'text', value: lit } as TextNode);
          }
          const exprContent = m[1].trim();
            if (exprContent) {
              const exprNode: ExprNodeUI = { type: 'expr', value: exprContent };
              try { exprNode.ast = parseExpression(exprContent); } catch { /* will be validated later */ }
              parts.push(exprNode);
            }
          last = m.index + m[0].length;
        }
        if (last < text.length) {
          const tail = text.slice(last).trim();
          if (tail) parts.push({ type: 'text', value: tail } as TextNode);
        }
        if (parts.length && stack.length) stack[stack.length - 1].children.push(...parts);
      }
      i = next === -1 ? src.length : next;
    }
  }
  const built = (root as any) || ({ type: 'text', value: src } as TextNode);
  return transformUiTreeToStructured(built);
}

function parseAttrs(src: string): Record<string, UIAttr> {
  const attrs: Record<string, UIAttr> = {};
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
      const inner = val.slice(1, -1).trim();
      const attr: UIAttr = { kind: 'expr', value: inner } as any;
      try { (attr as any).ast = parseExpression(inner); } catch { /* ignore parse error here */ }
      attrs[normalizeAttrKey(key)] = attr;
    } else {
      attrs[normalizeAttrKey(key)] = { kind: 'string', value: val };
    }
  }
  return attrs;
}

function normalizeAttrKey(k: string): string {
  if (k.startsWith('on:')) return 'on' + k.slice(3,4).toUpperCase() + k.slice(4);
  if (k === 'bind:value') return 'bindValue';
  return k.replace(':', '');
}

function transformUiTreeToStructured(node: any): UINode {
  if (!node || node.type !== 'element') return node as UINode;
  if ((node.attrs as any)?.forEach?.kind === 'forEach') {
    const fe = (node.attrs as any).forEach;
    const template = { ...node, attrs: Object.fromEntries(Object.entries(node.attrs).filter(([k]) => k !== 'forEach')) };
    return { type: 'forEach', item: fe.item, iterable: fe.iterable, template } as any;
  }
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
      i--;
    } else newChildren.push(cur);
  }
  node.children = newChildren;
  return node as UINode;
}
