import { spawn } from 'child_process';
import { buildProject } from './build';
import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { createIncrementalBuilder } from './incremental';

export async function dev(opts: { srcDir: string; debug?: boolean }) {
  // initial build
  try { await buildProject({ srcDir: opts.srcDir, debug: opts.debug }); } catch { /* ignore in dev startup */ }
  // start next.js and express servers (stubbed)
  const nextProc = spawnNext();
  const apiProc = spawnApi(opts.srcDir);
  nextProc.stdout.on('data', () => {});
  apiProc.stdout.on('data', () => {});

  // watch .locus files to trigger incremental rebuilds
  const chokidar = require('chokidar');
  const watcher = chokidar.watch('**/*.locus', { cwd: opts.srcDir, ignoreInitial: false, persistent: true, depth: 99 });
  const inc = createIncrementalBuilder({ srcDir: opts.srcDir, outDir: join(opts.srcDir, 'generated') });
  const initialFiles = collectLocusFiles(opts.srcDir);
  await inc.init(initialFiles);
  const debounce = createDebounce(100);
  const timed = async (label: string, fn: () => Promise<void>) => {
    const s = Date.now();
    await fn();
    if (opts.debug) {
      // eslint-disable-next-line no-console
      console.log(`[locus][dev][${label}]`, { ms: Date.now() - s });
    }
  };
  watcher.on('add', (rel: string) => debounce(() => timed('add', () => inc.update(join(opts.srcDir, rel))).catch(() => {})));
  watcher.on('change', (rel: string) => debounce(() => timed('change', () => inc.update(join(opts.srcDir, rel))).catch(() => {})));
  watcher.on('unlink', (rel: string) => debounce(() => timed('unlink', () => inc.remove(join(opts.srcDir, rel))).catch(() => {})));
  watcher.on('addDir', () => {});
  watcher.on('unlinkDir', () => {});
  watcher.on('error', () => {});

  // graceful shutdown
  const shutdown = () => {
    try { watcher.close(); } catch {}
    try { nextProc.kill(); } catch {}
    try { apiProc.kill(); } catch {}
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

function collectLocusFiles(dir: string): string[] {
  const results: string[] = [];
  const visit = (d: string) => {
    let entries: string[] = [];
    try { entries = readdirSync(d); } catch { return; }
    for (const name of entries) {
      const full = join(d, name);
      let isDir = false;
      try { isDir = statSync(full).isDirectory(); } catch { continue; }
      if (isDir) visit(full);
      else if (name.endsWith('.locus')) results.push(full);
    }
  };
  visit(dir);
  return results;
}

function spawnSafe(cmd: string, args: string[]) {
  // Cross-platform process spawn helper
  const proc = spawn(cmd, args, { stdio: 'pipe', shell: process.platform === 'win32' });
  return proc;
}

function createDebounce(ms: number) {
  let t: any;
  return (fn: () => void) => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

function spawnNext() {
  // Use env override if provided
  const cmd = process.env.LOCUS_NEXT_CMD;
  if (cmd) return spawnSafe(cmd, []);
  // Default to npm script (may be stub or real next depending on project)
  return spawnSafe('npm', ['run', 'next:dev']);
}

function spawnApi(srcDir: string) {
  // If generated server exists and express is available, run it with ts-node
  const serverTs = join(srcDir, 'generated', 'server.ts');
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require.resolve('express');
    if (existsSync(serverTs)) {
      const code = `require('ts-node/register/transpile-only'); require('${serverTs.replace(/\\/g, '\\\\')}')`;
      return spawnSafe('node', ['-e', code]);
    }
  } catch {
    // fall back to npm script
  }
  return spawnSafe('npm', ['run', 'api:dev']);
}
