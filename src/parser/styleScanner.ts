// Style block scanner: replaces each style:override block with a placeholder identifier + empty braces.

export interface ScannedStyleBlock {
  componentName: string;
  index: number; // ordinal within component
  fullStart: number;
  fullEnd: number;   // exclusive
  innerStart: number;
  innerEnd: number;
  content: string;
}

export interface StyleScanResult { transformed: string; blocks: ScannedStyleBlock[]; }

export let latestStyleBlocks: ScannedStyleBlock[] = [];
export let hasUnterminatedStyleBlock = false;

interface ComponentSpan { name: string; start: number; bodyStart: number; end: number; }

export function scanStyles(source: string): StyleScanResult {
  latestStyleBlocks = [];
  hasUnterminatedStyleBlock = false;
  const components: ComponentSpan[] = [];
  const compRe = /\bcomponent\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = compRe.exec(source)) !== null) {
    const name = m[1];
    let i = compRe.lastIndex; let depth = 1;
    while (i < source.length && depth > 0) { const ch = source[i]; if (ch === '{') depth++; else if (ch === '}') depth--; i++; }
    components.push({ name, start: m.index, bodyStart: compRe.lastIndex, end: i });
    compRe.lastIndex = i; // move beyond component
  }
  if (!components.length) return { transformed: source, blocks: [] };

  // Scan for style blocks globally and map to components
  const styleRe = /style:override\s*\{/g;
  let sx: RegExpExecArray | null;
  const replacements: Array<{ start: number; end: number; placeholder: string; comp: string; innerStart: number; innerEnd: number; idx: number; content: string; }> = [];
  const counters: Record<string, number> = {};
  while ((sx = styleRe.exec(source)) !== null) {
    const start = sx.index;
    const openBracePos = styleRe.lastIndex - 1; // position of '{'
    // find matching closing brace
    let depth = 1; let i = openBracePos + 1;
    while (i < source.length && depth > 0) { const ch = source[i]; if (ch === '{') depth++; else if (ch === '}') depth--; i++; }
    if (depth !== 0) { hasUnterminatedStyleBlock = true; break; }
    const end = i; // exclusive
    // find owning component
    const comp = components.find(c => start >= c.bodyStart && start < c.end);
    if (!comp) continue; // ignore stray style outside components
    const count = (counters[comp.name] = (counters[comp.name] ?? 0) + 1) - 1;
    const innerStart = openBracePos + 1; const innerEnd = end - 1;
    const content = source.slice(innerStart, innerEnd);
    const placeholder = `sob${count}{}`; // includes braces
    replacements.push({ start, end, placeholder, comp: comp.name, innerStart, innerEnd, idx: count, content });
  }
  if (!replacements.length) return { transformed: source, blocks: [] };
  replacements.sort((a,b)=>a.start-b.start);
  let out = ''; let last = 0;
  for (const r of replacements) {
    out += source.slice(last, r.start);
    out += r.placeholder + ' '; // trailing space to separate next token
    last = r.end;
    latestStyleBlocks.push({ componentName: r.comp, index: r.idx, fullStart: r.start, fullEnd: r.end, innerStart: r.innerStart, innerEnd: r.innerEnd, content: r.content });
  }
  out += source.slice(last);
  return { transformed: out, blocks: latestStyleBlocks };
}

