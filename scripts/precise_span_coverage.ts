#!/usr/bin/env ts-node
// Rough coverage metric: count thrown VError/PError lines that pass a loc vs those without.
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..', 'src');
let total = 0; let withLoc = 0;
function scan(file: string) {
  const txt = fs.readFileSync(file,'utf8');
  const lines = txt.split(/\n/);
  lines.forEach((ln,i) => {
    const throwMatch = /throw new (VError|PError)\(/.test(ln);
    if (throwMatch) {
      total++;
      if (/\bline\s*[,)]/.test(ln) || /startLine/.test(ln)) withLoc++; // heuristic
    }
  });
}
function walk(dir: string) { for (const f of fs.readdirSync(dir)) { const p = path.join(dir,f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else if (/\.ts$/.test(f)) scan(p); } }
walk(root);
const pct = total ? (withLoc/total*100).toFixed(1) : '0.0';
console.log(JSON.stringify({ totalErrors: total, withLoc, percent: pct }));