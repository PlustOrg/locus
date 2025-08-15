import { spawn } from 'child_process';

export async function dev(opts: { srcDir: string }) {
  // initial build (would call buildProject in a full impl)
  // start next.js and express servers (stubbed)
  const nextProc = spawn('npm', ['run', 'next:dev'], { stdio: 'pipe' });
  const apiProc = spawn('npm', ['run', 'api:dev'], { stdio: 'pipe' });
  nextProc.stdout.on('data', () => {});
  apiProc.stdout.on('data', () => {});

  // watch .locus files to trigger rebuilds
  const chokidar = require('chokidar');
  const watcher = chokidar.watch('**/*.locus', { cwd: opts.srcDir });
  watcher.on('change', () => {
    // trigger re-build (stub)
  });
}
