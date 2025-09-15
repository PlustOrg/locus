import { UIAttr, UINode } from './uiAstTypes';

export function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

export function transformUi(ui: string, _state: any[]): string {
  let out = ui;
  out = out.replace(/on:([a-zA-Z]+)/g, (_, ev) => `on${capitalize(ev)}`);
  out = out.replace(/bind:value=\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_m, v) => {
    const setter = `set${capitalize(v)}`;
    return `value={${v}} onChange={(e) => ${setter}(e.target.value)}`;
  });
  out = out.replace(/<([A-Za-z_][A-Za-z0-9_]*)\s+([^>]*?)for:each=\{\s*([A-Za-z_][A-Za-z0-9_]*)\s+in\s+([^}]+)\}\s*([^>]*)>([\s\S]*?)<\/\1>/g,
    (_m, tag, preAttrs, item, arr, postAttrs, body) => {
      const inner = transformIfElse(body.trim());
      const open = `<${tag} ${preAttrs.trim()} ${postAttrs.trim()}`.replace(/\s+/g, ' ').trim();
      return `{${arr}.map((${item}, index) => (\n  ${open} key={index}>${inner}</${tag}>\n))}`;
    });
  out = out.replace(/<([A-Za-z_][A-Za-z0-9_]*)\s+([^>]*?)for:each=\{\s*([A-Za-z_][A-Za-z0-9_]*)\s+in\s+([^}]+)\}\s*([^>]*)\/>/g,
    (_m, tag, preAttrs, item, arr, postAttrs) => {
      const open = `<${tag} ${preAttrs.trim()} ${postAttrs.trim()}`.replace(/\s+/g, ' ').trim();
      return `{${arr}.map((${item}, index) => (\n  ${open} key={index} />\n))}`;
    });
  out = transformIfElse(out);
  return out;
}

export function transformIfElse(src: string): string {
  const ifMatch = src.match(/<if\s+condition=\{([\s\S]*?)\}\s*>\s*([\s\S]*?)\s*<\/if>/m);
  if (!ifMatch) return src;
  const ifCond = ifMatch[1];
  const ifBody = ifMatch[2];
  const elseifMatch = src.match(/<elseif\s+condition=\{([\s\S]*?)\}\s*>\s*([\s\S]*?)\s*<\/elseif>/m);
  const elseMatch = src.match(/<else\s*>\s*([\s\S]*?)\s*<\/else>/m);
  let middle = '';
  if (elseifMatch) {
    middle = `: ${elseifMatch[1]} ? (\n${elseifMatch[2]}\n) `;
  }
  const end = elseMatch ? `: (\n${elseMatch[1]}\n)` : ': null';
  const ternary = `{${ifCond} ? (\n${ifBody}\n) ${middle}${end}}`;
  return src
    .replace(/<if[\s\S]*?<\/if>/m, '__IF_BLOCK__')
    .replace(/<elseif[\s\S]*?<\/elseif>/m, '')
    .replace(/<else[\s\S]*?<\/else>/m, '')
    .replace('__IF_BLOCK__', ternary);
}

export function renderUiAst(node: any): string {
  if (node.type === 'text') return node.value;
  if (node.type === 'expr') return `{${node.value}}`;
  if (node.type === 'slot') return node.name === 'default' ? '{children}' : `{${node.name}}`;
  if (node.type === 'forEach') {
    const inner = renderElement(node.template.tag, node.template.attrs, node.template.children, true);
    return `{${node.iterable}.map((${node.item}, index) => (\n${inner.replace(/<([A-Za-z0-9_:-]+)([^>]*)\/>/, '<$1$2 key={index} />')}\n))}`;
  }
  if (node.type === 'if') {
    let expr = `{${node.condition} ? (\n${renderChildren(node.consequent)}\n)`;
    if ((node.elif || []).length) for (const e of node.elif) expr += ` : ${e.condition} ? (\n${renderChildren(e.children)}\n)`;
    if (node.else && node.else.length) expr += ` : (\n${renderChildren(node.else)}\n)`; else expr += ' : null';
    expr += '}';
    return expr;
  }
  if (['if','elseif','else'].includes(node.tag)) return renderChildren(node.children||[]);
  return renderElement(node.tag, node.attrs || {}, node.children || [], false);
}

export function renderElement(tag: string, attrs: Record<string, UIAttr>, children: UINode[], _alreadyHasKey: boolean): string {
  const attrStrs: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'forEach') continue;
    if (k.startsWith('bind$') && (v as any).kind === 'expr') {
      const prop = k.slice(5);
      const stateVar = (v as any).value;
      const setter = `set${capitalize(stateVar)}`;
      if (prop === 'value') { attrStrs.push(`value={${stateVar}}`, `onChange={(e) => ${setter}(e.target.value)}`); continue; }
      if (prop === 'checked') { attrStrs.push(`checked={${stateVar}}`, `onChange={(e) => ${setter}(e.target.checked)}`); continue; }
      if (prop === 'disabled') { attrStrs.push(`disabled={${stateVar}}`); continue; }
      attrStrs.push(`${prop}={${stateVar}}`, `onChange={(e) => ${setter}(e.target?.value ?? e.target?.checked)}`);
      continue;
    }
    const key = k === 'class' ? 'className' : k;
    if ((v as any).kind === 'string') attrStrs.push(`${key}="${(v as any).value}"`);
    else if ((v as any).kind === 'expr') attrStrs.push(`${key}={${(v as any).value}}`);
  }
  const open = `<${tag}${attrStrs.length ? ' ' + attrStrs.join(' ') : ''}`;
  if (!children || children.length === 0) return `${open} />`;
  const inner = renderChildren(children);
  return `${open}>${inner}</${tag}>`;
}

export function renderChildren(children: UINode[]): string {
  const out: string[] = [];
  for (let i = 0; i < children.length; i++) {
    const cur: any = children[i];
    if (cur && cur.type === 'element' && cur.tag === 'if') {
      const chain = [cur];
      let j = i + 1;
      while (j < children.length) {
        const next: any = children[j];
        if (next && next.type === 'element' && (next.tag === 'elseif' || next.tag === 'else')) { chain.push(next); j++; } else break;
      }
      const ifNode = chain[0];
      const cond = (((ifNode.attrs || {}) as any).condition || { kind: 'expr', value: 'false' }).value;
      const ifBody = (ifNode.children || []).map((c: any) => renderUiAst(c)).join('');
      let expr = `{${cond} ? (\n${ifBody}\n)`;
      for (let k = 1; k < chain.length; k++) {
        const node: any = chain[k];
        if (node.tag === 'elseif') {
          const ec = (((node.attrs || {}) as any).condition || { kind: 'expr', value: 'false' }).value;
          const eb = (node.children || []).map((c: any) => renderUiAst(c)).join('');
          expr += ` : ${ec} ? (\n${eb}\n)`;
        } else if (node.tag === 'else') {
          const eb = (node.children || []).map((c: any) => renderUiAst(c)).join('');
          expr += ` : (\n${eb}\n)`;
        }
      }
      if (!chain.some((n: any) => n.tag === 'else')) expr += ' : null';
      expr += '}';
      out.push(expr);
      i = j - 1;
    } else {
      out.push(renderUiAst(children[i] as any));
    }
  }
  return out.join('');
}
