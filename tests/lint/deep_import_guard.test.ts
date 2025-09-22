import fs from 'fs';
import path from 'path';

// T5: deep import guard test
const ALLOW = new Set(['index', 'index-internal', 'tokens', 'expr', 'merger', 'builderUtils']);

test('no deep parser imports except allowed', () => {
  const disallowed: string[] = [];
  const root = path.join(__dirname, '..', '..', 'src');
  walk(root);
  if (disallowed.length) {
    throw new Error('Deep parser imports found:\n' + disallowed.join('\n'));
  }
  function walk(dir: string) {
    for (const e of fs.readdirSync(dir)) {
      const p = path.join(dir, e);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p); else if (p.endsWith('.ts')) checkFile(p);
    }
  }
  function checkFile(f: string) {
    const txt = fs.readFileSync(f, 'utf8');
    const regex = /from ['"]\.\.\/parser\/(.+?)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(txt))) {
      const target = m[1];
      const top = target.split('/')[0];
      if (!ALLOW.has(top)) disallowed.push(f.slice(root.length + 1) + ':' + target);
    }
  }
});
