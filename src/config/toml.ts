export type Toml = Record<string, any> & { _sections?: Record<string, any> };

function parseValue(v: string): any {
  let t = v.trim();
  const isQuoted = (t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"));
  if (isQuoted) t = t.slice(1, -1);
  const envMatch = /^env\(([^)]+)\)$/.exec(t);
  if (envMatch) return process.env[envMatch[1]];
  if (/^\d+$/.test(t)) return Number(t);
  if (t === 'true' || t === 'false') return t === 'true';
  return t;
}

export function parseToml(src: string): Toml {
  const out: Toml = { _sections: {} };
  let current: any = out;
  for (const rawLine of src.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const sec = /^\[([^\]]+)\]$/.exec(line);
    if (sec) {
      const name = sec[1];
      out._sections![name] = out._sections![name] || {};
      current = out._sections![name];
      continue;
    }
    const kv = /^(\w+)\s*=\s*(.+)$/.exec(line);
    if (kv) {
      current[kv[1]] = parseValue(kv[2]);
    }
  }
  return out;
}
