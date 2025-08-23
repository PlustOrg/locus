import { LocusFileAST, ComponentBlock } from '../ast';

interface StyleBlock { content: string; start: number; end: number; }

export function attachComponentStyles(ast: LocusFileAST, source: string) {
  for (const comp of ast.components) {
    const span = findComponentSpan(comp, source);
    if (!span) continue;
    const body = source.slice(span.bodyStart, span.bodyEnd);
    const blocks = scanStyleBlocks(body);
    if (blocks.length) {
      (comp as any).styleOverrides = blocks.map(b => ({ content: b.content.trim() }));
      comp.styleOverride = blocks[blocks.length - 1].content.trim();
    }
  }
}

function findComponentSpan(comp: ComponentBlock, source: string): { bodyStart: number; bodyEnd: number } | null {
  const re = new RegExp(`\\bcomponent\\s+${comp.name}\\s*{`, 'g');
  const m = re.exec(source);
  if (!m) return null;
  const bracePos = source.indexOf('{', m.index);
  if (bracePos === -1) return null;
  let depth = 1; let i = bracePos + 1;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === '{') depth++; else if (ch === '}') depth--;
    i++;
  }
  if (depth !== 0) return null;
  return { bodyStart: bracePos + 1, bodyEnd: i - 1 };
}

function scanStyleBlocks(text: string): StyleBlock[] {
  const blocks: StyleBlock[] = [];
  let idx = 0;
  while (true) {
    const start = text.indexOf('style:override', idx);
    if (start === -1) break;
    const brace = text.indexOf('{', start + 'style:override'.length);
    if (brace === -1) break;
    let depth = 1; let i = brace + 1;
    while (i < text.length && depth > 0) {
      const ch = text[i];
      if (ch === '{') depth++; else if (ch === '}') depth--;
      i++;
    }
    if (depth !== 0) break;
    const innerStart = brace + 1; const innerEnd = i - 1;
    blocks.push({ content: text.slice(innerStart, innerEnd), start, end: i });
    idx = i;
  }
  return blocks;
}
