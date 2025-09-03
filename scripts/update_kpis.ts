import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Inserts latest metrics summary into production readiness checklist between markers.
const docPath = join('docs','reference','production-readiness-checklist.md');
const metricsPath = join('generated','METRICS_SUMMARY.json');
if (!existsSync(docPath)) process.exit(0);
let doc = readFileSync(docPath,'utf8');
const startMarker = '<!-- KPIS_START -->';
const endMarker = '<!-- KPIS_END -->';
if (!doc.includes(startMarker)) {
  doc += `\n\n${startMarker}\n${endMarker}\n`;
}
let metrics: any = {};
if (existsSync(metricsPath)) {
  try { metrics = JSON.parse(readFileSync(metricsPath,'utf8')); } catch {/* ignore */}
}
const kpiBlock = [startMarker, '```json', JSON.stringify(metrics,null,2), '```', endMarker].join('\n');
doc = doc.replace(new RegExp(startMarker+'[\s\S]*?'+endMarker), kpiBlock);
writeFileSync(docPath, doc);
console.log('[kpis] updated production readiness checklist with latest metrics');
