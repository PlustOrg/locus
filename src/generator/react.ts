export function generateReactPage(page: any, knownComponentNames: string[] = [], _warnings?: string[]): string {
  const usesState = Array.isArray(page.state) && page.state.length > 0;
  const usesEffect = !!page.onLoad;
  const usesActions = Array.isArray(page.actions) && page.actions.length > 0;
  const needsClient = usesState || usesEffect || usesActions;
  const importHooks: string[] = [];
  if (usesState) importHooks.push('useState');
  if (usesEffect) importHooks.push('useEffect');
  const hooksSegment = importHooks.length ? `, { ${importHooks.join(', ')} }` : '';
  const directive = needsClient ? `'use client';\n` : '';
  const imports = `import React${hooksSegment} from 'react';\n`;
  const compStart = `export default function ${page.name}() {\n`;
  const stateLines = usesState ? (page.state || []).map((s: any) => `  const [${s.name}, set${capitalize(s.name)}] = useState(${s.default});`).join('\n') : '';
  const onLoad = usesEffect ? `\n  useEffect(() => {\n    ${page.onLoad}\n  }, []);\n` : '';
  const actions = (page.actions || []).map((a: any) => `  function ${a.name}(${(a.params||[]).join(', ')}) {\n    ${a.body || ''}\n  }`).join('\n\n');
  const originalUi = stripUiWrapper(page.ui) || '<div />';
  const uiContent = page.uiAst ? renderUiAst(page.uiAst) : transformUi(originalUi, page.state || []);
  // Auto-detect component usage: JSX tags starting with capital letter that are in knownComponentNames
  const used = new Set<string>();
  const tagRegex = /<([A-Z][A-Za-z0-9_]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(originalUi)) !== null) {
    const name = m[1];
    if (knownComponentNames.includes(name) && name !== page.name) used.add(name);
  }
  const importLines = Array.from(used).map(n => `import ${n} from '../components/${n}'`).join('\n');
  const ui = `\n  return (\n    ${uiContent}\n  );\n`;
  const end = `}\n`;
  return [directive, imports, importLines, importLines ? '' : '', compStart, stateLines, onLoad, actions, ui, end].join('\n');
}

export function generateReactComponent(component: any, warnings?: string[]): string {
  const hasState = Array.isArray(component.state) && component.state.length > 0; // future-proof
  const needsClient = hasState; // extend if components gain effects/actions later
  const importHooks = hasState ? ', { useState }' : '';
  const directive = needsClient ? `'use client';\n` : '';
  const imports = `import React${importHooks} from 'react';\n`;
  const originalUi = stripUiWrapper(component.ui) || '<div />';
  const hasChildrenRef = /\{\s*children\s*\}/.test(originalUi);
  // Detect potential named slots: {identifierSlot} pattern
  const slotRefRegex = /\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}/g;
  const namedSlotRefs = new Set<string>();
  let mSlot: RegExpExecArray | null;
  while ((mSlot = slotRefRegex.exec(originalUi)) !== null) {
    const name = mSlot[1];
    if (name !== 'children' && /Slot$/.test(name)) namedSlotRefs.add(name);
  }
  const explicitChildren = (component.params || []).some((p: any) => p.name === 'children');
  // Build augmented params list (do not mutate original object) if children referenced but not declared
  const effectiveParams = [...(component.params || [])];
  if (hasChildrenRef && !explicitChildren) {
    effectiveParams.push({ name: 'children', type: { kind: 'primitive', name: 'slot' } });
    warnings?.push(`Component ${component.name}: auto-added slot param 'children' (referenced in UI but not declared).`);
  }
  for (const slotName of namedSlotRefs) {
    if (!effectiveParams.some(p => p.name === slotName)) {
      effectiveParams.push({ name: slotName, type: { kind: 'primitive', name: 'slot' } });
      warnings?.push(`Component ${component.name}: auto-added named slot param '${slotName}' (referenced in UI).`);
    }
  }
  const props = effectiveParams.map((p: any) => `${p.name}: ${mapPropType(p.type)}`).join('; ');
  const propsInterface = props ? `interface ${component.name}Props { ${props} }\n` : '';
  const hasChildrenProp = effectiveParams.some((p: any) => p.name === 'children');
  const signature = props ? `(${hasChildrenProp ? '{ children, ...rest }' : lowerFirst(component.name) + 'Props'}: ${component.name}Props)` : `()`;
  const uiContent = component.uiAst ? renderUiAst(component.uiAst) : transformUi(originalUi, component.state || []);
  const stateLines = hasState ? (component.state || []).map((s: any) => `  const [${s.name}, set${capitalize(s.name)}] = useState(${s.default});`).join('\n') + '\n' : '';
  const autoAddedNote = (warnings || []).some(w => w.includes(`Component ${component.name}: auto-added`))
    ? `/* NOTE: One or more slot params were auto-added based on UI usage. Consider declaring them explicitly in the component definition for clarity. */\n`
    : '';
  const comp = `export default function ${component.name}${signature} {\n${stateLines}  return (\n    ${uiContent}\n  );\n}\n`;
  return [directive, imports, propsInterface, autoAddedNote, comp].join('\n');
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function lowerFirst(s: string) { return s.charAt(0).toLowerCase() + s.slice(1); }
function stripUiWrapper(ui?: string): string | undefined {
  if (!ui) return undefined;
  const m = /\bui\s*\{([\s\S]*?)\}$/m.exec(ui.trim());
  if (m) return m[1];
  return ui;
}

function mapPropType(t: any): string {
  if (!t) return 'any';
  if (t.kind === 'primitive') {
    const n = String(t.name || '').toLowerCase();
    if (n === 'string' || n === 'text') return 'string';
    if (n === 'integer' || n === 'decimal' || n === 'number') return 'number';
    if (n === 'boolean') return 'boolean';
    if (n === 'datetime' || n === 'date') return 'string';
    if (n === 'json' || n === 'any') return 'any';
    if (n === 'slot' || n === 'node' || n === 'children') return 'React.ReactNode';
    return 'any';
  }
  if (t.kind === 'list') return 'any[]';
  return 'any';
}

function transformUi(ui: string, _state: any[]): string {
  let out = ui;
  // events: on:click -> onClick, on:submit -> onSubmit, etc.
  out = out.replace(/on:([a-zA-Z]+)/g, (_, ev) => `on${capitalize(ev)}`);

  // bind:value={var} -> value={var} onChange={(e) => setVar(e.target.value)}
  out = out.replace(/bind:value=\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_m, v) => {
    const setter = `set${capitalize(v)}`;
    const onChange = `onChange={(e) => ${setter}(e.target.value)}`;
    return `value={${v}} ${onChange}`;
  });

  // <if condition={expr}> ... </if><elseif condition={expr2}> ... </elseif><else> ... </else>
  out = transformIfElse(out);

  // for:each={item in items} on a tag -> wrap with items.map
  out = out.replace(/<([A-Za-z_][A-Za-z0-9_]*)\s+([^>]*?)for:each=\{\s*([A-Za-z_][A-Za-z0-9_]*)\s+in\s+([^}]+)\}\s*([^>]*)\/>/g,
    (_m, tag, preAttrs, item, arr, postAttrs) => {
      const open = `<${tag} ${preAttrs.trim()} ${postAttrs.trim()}`.replace(/\s+/g, ' ').trim();
      return `{${arr}.map((${item}, index) => (\n  ${open} key={index} />\n))}`;
    });

  return out;
}

function transformIfElse(src: string): string {
  // Capture the trio as they appear and convert to ternary blocks.
  // This is a simplistic pass and assumes one chain.
  const ifRe = /<if\s+condition=\{([\s\S]*?)\}\s*>[\s\S]*?<\/if>/m;
  const elseifRe = /<elseif\s+condition=\{([\s\S]*?)\}\s*>[\s\S]*?<\/elseif>/m;
  const elseRe = /<else\s*>[\s\S]*?<\/else>/m;

  // Extract contents
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
  // Replace the whole if/elseif/else chain
  return src
    .replace(ifRe, '__IF_BLOCK__')
    .replace(elseifRe, '')
    .replace(elseRe, '')
    .replace('__IF_BLOCK__', ternary);
}

// --- UI AST rendering ---
type UIAttr = { kind: 'string'; value: string } | { kind: 'expr'; value: string } | { kind: 'forEach'; item: string; iterable: string };
type IfNode = { type: 'if'; condition: string; consequent: UINode[]; elif?: Array<{ condition: string; children: UINode[] }>; else?: UINode[] };
type ForEachNode = { type: 'forEach'; item: string; iterable: string; template: any };
type UINode = { type: 'text'; value: string } | { type: 'element'; tag: string; attrs: Record<string, UIAttr>; children: UINode[] } | IfNode | ForEachNode;

function renderUiAst(node: UINode): string {
  if ((node as any).type === 'text') {
    return (node as any).value;
  }
  if ((node as any).type === 'forEach') {
    const fe = node as any as ForEachNode;
    const inner = renderElement(fe.template.tag, fe.template.attrs, fe.template.children, true);
    return `{${fe.iterable}.map((${fe.item}, index) => (\n${inner.replace(/<([A-Za-z0-9_:-]+)([^>]*)\/>/, '<$1$2 key={index} />')}\n))}`;
  }
  if ((node as any).type === 'if') {
    const ifn = node as any as IfNode;
    let expr = `{${ifn.condition} ? (\n${renderChildren(ifn.consequent)}\n)`;
    if ((ifn.elif || []).length) {
      for (const e of ifn.elif!) {
        expr += ` : ${e.condition} ? (\n${renderChildren(e.children)}\n)`;
      }
    }
    if (ifn.else && ifn.else.length) expr += ` : (\n${renderChildren(ifn.else)}\n)`; else expr += ` : null`;
    expr += `}`;
    return expr;
  }
  const el = node as any as { tag: string; attrs: Record<string, UIAttr>; children: UINode[] };
  return renderElement(el.tag, el.attrs || {}, el.children || [], false);
}

function renderElement(tag: string, attrs: Record<string, UIAttr>, children: UINode[], _alreadyHasKey: boolean): string {
  const attrStrs: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'forEach') continue;
    if (k === 'bindValue' && (v as any).kind === 'expr') {
      const stateVar = (v as any).value;
      const setter = `set${capitalize(stateVar)}`;
      attrStrs.push(`value={${stateVar}}`);
      attrStrs.push(`onChange={(e) => ${setter}(e.target.value)}`);
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

function renderChildren(children: UINode[]): string {
  const out: string[] = [];
  for (let i = 0; i < children.length; i++) {
    const cur: any = children[i];
    if (cur && cur.type === 'element' && cur.tag === 'if') {
      const chain = [cur];
      let j = i + 1;
      while (j < children.length) {
        const next: any = children[j];
        if (next && next.type === 'element' && (next.tag === 'elseif' || next.tag === 'else')) {
          chain.push(next);
          j++;
        } else break;
      }
      // Build ternary chain
      const ifNode = chain[0];
      const cond = (((ifNode.attrs || {}) as any).condition || { kind: 'expr', value: 'false' }).value;
      const ifBody = (ifNode.children || []).map((c: any) => renderUiAst(c)).join('');
      let expr = `{${cond} ? (\n${ifBody}\n)`;
      // subsequent elseif nodes
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
      if (!chain.some((n: any) => n.tag === 'else')) expr += ` : null`;
      expr += `}`;
      out.push(expr);
      i = j - 1; // skip consumed
    } else {
      out.push(renderUiAst(children[i] as any));
    }
  }
  return out.join('');
}
