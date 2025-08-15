export function preprocessSource(input: string): string {
  const kinds = ['page', 'component', 'store'] as const;
  let src = input;

  for (const kind of kinds) {
    src = stripBlockBodies(src, kind);
  }
  return src;
}

function stripBlockBodies(source: string, kind: string): string {
  const re = new RegExp(`\\b${kind}\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\{`, 'g');
  let m: RegExpExecArray | null;
  let result = '';
  let lastIndex = 0;
  while ((m = re.exec(source)) !== null) {
    const start = m.index;
    const name = m[1];
    // find matching closing brace
    let i = re.lastIndex; // position after opening brace
    let depth = 1;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      i++;
    }
    const end = i; // position after closing brace
    result += source.slice(lastIndex, start) + `${kind} ${name} {}`;
    lastIndex = end;
    re.lastIndex = end; // continue after replaced block
    if (i >= source.length) break;
  }
  result += source.slice(lastIndex);
  return result;
}
