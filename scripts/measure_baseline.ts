#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

const runs = Number(process.env.LOCUS_BASELINE_RUNS || '3');
const metrics: any[] = [];
for (let i=0;i<runs;i++) {
  execSync('node dist/index.js build --src . --out generated --suppress-warnings', { stdio: 'inherit' });
  const mPath = path.join('generated','METRICS_SUMMARY.json');
  const data = JSON.parse(readFileSync(mPath,'utf8'));
  metrics.push(data);
}
function avg(key: string) { return metrics.reduce((a,b)=>a + ((b.timings||{})[key]||0),0)/metrics.length; }
function avgMem(key: string) { return metrics.reduce((a,b)=>a + ((b.memory||{})[key]||0),0)/metrics.length; }
const summary = {
  runs,
  avgParseMs: +avg('parseMs').toFixed(2),
  avgMergeMs: +avg('mergeMs').toFixed(2),
  avgGenerateMs: +avg('generateMs').toFixed(2),
  avgTotalMs: +avg('totalMs').toFixed(2),
  avgAfterParseMB: +avgMem('afterParseMB').toFixed(2),
  avgAfterMergeMB: +avgMem('afterMergeMB').toFixed(2),
  avgAfterGenerateMB: +avgMem('afterGenerateMB').toFixed(2)
};
writeFileSync(path.join('scripts','perf-baseline.json'), JSON.stringify(summary,null,2));
console.log('[baseline] updated scripts/perf-baseline.json');
