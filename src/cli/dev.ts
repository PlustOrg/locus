import { spawn } from 'child_process';
import { buildProject } from './build';

export async function dev(opts: { srcDir: string }) {
  // initial build
  try { await buildProject({ srcDir: opts.srcDir }); } catch { /* ignore in dev startup */ }
  // start next.js and express servers (stubbed)
  const nextProc = spawn('npm', ['run', 'next:dev'], { stdio: 'pipe' });
  const apiProc = spawn('npm', ['run', 'api:dev'], { stdio: 'pipe' });
  nextProc.stdout.on('data', () => {});
  apiProc.stdout.on('data', () => {});

  // watch .locus files to trigger rebuilds
  const chokidar = require('chokidar');
  const watcher = chokidar.watch('**/*.locus', { cwd: opts.srcDir });
  watcher.on('change', async () => {
    try { await buildProject({ srcDir: opts.srcDir }); } catch { /* ignore in dev */ }
  });
}
