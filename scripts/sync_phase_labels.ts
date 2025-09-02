#!/usr/bin/env ts-node
/**
 * Synchronize GitHub issue labels for phase markers (P1..P5) based on checklist.
 * Usage: GH_TOKEN=... REPO=owner/name ts-node scripts/sync_phase_labels.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';

interface Label { name: string; color: string; description?: string }

const token = process.env.GH_TOKEN;
const repo = process.env.REPO; // format owner/name
if (!repo) {
  console.error('[sync-labels] REPO env var required (owner/name)');
  process.exit(1);
}

const want: Label[] = [
  { name: 'phase:P1', color: 'b60205', description: 'Core' },
  { name: 'phase:P2', color: 'd93f0b', description: 'Workflows' },
  { name: 'phase:P3', color: 'fbca04', description: 'UI' },
  { name: 'phase:P4', color: '0e8a16', description: 'Advanced' },
  { name: 'phase:P5', color: '5319e7', description: 'Perf & GA' },
];

async function run() {
  if (!token) {
    console.log('[sync-labels] GH_TOKEN not set; dry run printing desired labels:');
    for (const l of want) console.log('-', l.name);
    return;
  }
  const headers = { Authorization: `Bearer ${token}`, 'User-Agent': 'locus-script', Accept: 'application/vnd.github+json' } as any;
  const existing: any[] = await (await fetch(`https://api.github.com/repos/${repo}/labels?per_page=100`, { headers })).json();
  for (const l of want) {
    const found = existing.find(e => e.name === l.name);
    if (!found) {
      console.log('[sync-labels] creating', l.name);
      await fetch(`https://api.github.com/repos/${repo}/labels`, { method: 'POST', headers, body: JSON.stringify(l) });
    } else {
      // optional update if color/description drift
      if (found.color !== l.color || found.description !== l.description) {
        console.log('[sync-labels] updating', l.name);
        await fetch(`https://api.github.com/repos/${repo}/labels/${encodeURIComponent(l.name)}`, { method: 'PATCH', headers, body: JSON.stringify(l) });
      }
    }
  }
  console.log('[sync-labels] complete');
}
run().catch(e => { console.error('[sync-labels] error', e); process.exit(1); });
