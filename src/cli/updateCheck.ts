import https from 'https';
import { tmpdir } from 'os';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import pkgJson from '../../package.json';

const ONE_DAY = 24 * 60 * 60 * 1000;
const pkg: any = pkgJson;

export function checkForUpdate() {
  if (process.env.LOCUS_NO_UPDATE_CHECK === '1' || process.env.NODE_ENV === 'test') return;
  try {
    const cacheFile = join(tmpdir(), 'locus-update.json');
    if (existsSync(cacheFile)) {
      const data = JSON.parse(readFileSync(cacheFile, 'utf8'));
      if (Date.now() - data.ts < ONE_DAY) {
        if (data.latest && isNewer(data.latest, pkg.version)) emit(data.latest);
        return;
      }
    }
    const req = https.get({ hostname: 'registry.npmjs.org', path: '/locus', timeout: 2000 }, res => {
      const chunks: any[] = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const latest = body['dist-tags']?.latest;
          writeFileSync(cacheFile, JSON.stringify({ ts: Date.now(), latest }));
          if (latest && isNewer(latest, pkg.version)) emit(latest);
        } catch {/* ignore */}
      });
    });
    req.on('error', ()=>{});
  } catch {/* ignore */}
}

function isNewer(a: string, b: string): boolean {
  const pa = a.split('.').map(n=>parseInt(n,10));
  const pb = b.split('.').map(n=>parseInt(n,10));
  for (let i=0;i<Math.max(pa.length,pb.length);i++) {
    const da = pa[i]||0, db = pb[i]||0;
    if (da>db) return true; if (da<db) return false;
  }
  return false;
}

function emit(latest: string) {
  process.stdout.write(chalk.cyan(`[locus] Update available ${pkg.version} -> ${latest} (set LOCUS_NO_UPDATE_CHECK=1 to disable)\n`));
}
