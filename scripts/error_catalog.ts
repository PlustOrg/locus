#!/usr/bin/env ts-node
// Extracts LocusError codes & messages usage patterns (naive string scan)
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..', 'src');
const entries: Array<{ file: string; line: number; message: string }> = [];
function walk(dir: string) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.ts$/.test(f)) {
      const txt = fs.readFileSync(p, 'utf8');
      const lines = txt.split(/\n/);
      lines.forEach((ln,i)=>{
        const m = /throw new VError\(`([^`]+)`/.exec(ln) || /throw new PError\(`([^`]+)`/.exec(ln);
        if (m) entries.push({ file: path.relative(root,p), line: i+1, message: m[1] });
      });
    }
  }
}
walk(root);
console.log(JSON.stringify(entries, null, 2));
