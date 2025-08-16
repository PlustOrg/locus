import { spawn } from 'child_process';
import { buildProject } from './build';
import { readdirSync } from 'fs';
import { join } from 'path';
import { createIncrementalBuilder } from './incremental';

export async function dev(opts: { srcDir: string }) {
  // initial build
  try { await buildProject({ srcDir: opts.srcDir }); } catch { /* ignore in dev startup */ }
  // start next.js and express servers (stubbed)
  const nextProc = spawn('npm', ['run', 'next:dev'], { stdio: 'pipe' });
  const apiProc = spawn('npm', ['run', 'api:dev'], { stdio: 'pipe' });
  nextProc.stdout.on('data', () => {});
  apiProc.stdout.on('data', () => {});

  // watch .locus files to trigger incremental rebuilds
  const chokidar = require('chokidar');
  const watcher = chokidar.watch('**/*.locus', { cwd: opts.srcDir });
  const inc = createIncrementalBuilder({ srcDir: opts.srcDir, outDir: join(opts.srcDir, 'generated') });
  const initialFiles = collectLocusFiles(opts.srcDir);
  await inc.init(initialFiles);
  watcher.on('change', async (relPath: string) => {
    try { await inc.update(join(opts.srcDir, relPath)); } catch { /* ignore in dev */ }
  });
}

function collectLocusFiles(dir: string): string[] {
  // Shallow collect; dev only needs to bootstrap known files; build handles recursion
  try {
    const entries = readdirSync(dir);
    return entries.filter(e => e.endsWith('.locus')).map(e => join(dir, e));
  } catch {
    return [];
  }
}
