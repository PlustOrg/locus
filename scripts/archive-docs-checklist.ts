#!/usr/bin/env ts-node
/**
 * Generates an archive copy of the docs overhaul checklist with date stamp
 * when completion percentage >= provided threshold (default 90).
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..');
const checklist = join(ROOT, 'planning', 'overhaul', 'docs-overhaul-checklist.md');
const outDir = join(ROOT, 'planning', 'overhaul');
const threshold = parseInt(process.argv[2] || '90', 10);
if (!existsSync(checklist)) {
  console.error('Checklist not found');
  process.exit(1);
}
const raw = readFileSync(checklist, 'utf8');
const total = (raw.match(/- \[[ x]/g) || []).length;
const done = (raw.match(/- \[x\]/g) || []).length;
const pct = total ? Math.round((done/total)*100) : 0;
if (pct < threshold) {
  console.log(`Completion ${pct}% below threshold ${threshold}%. Skipping archive.`);
  process.exit(0);
}
const date = new Date().toISOString().slice(0,10);
const outFile = join(outDir, `docs-overhaul-checklist.archive-${date}.md`);
writeFileSync(outFile, raw);
console.log('Archived checklist to', outFile, 'completion:', pct + '%');
