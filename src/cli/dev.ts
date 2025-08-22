/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-require-imports */
import { spawn } from 'child_process';
import { buildProject } from './build';
import { readdirSync, statSync, existsSync } from 'fs';
import { LocusError } from '../errors';
import { reportError, ErrorOutputFormat } from './reporter';
import { join, relative } from 'path';
import chalk from 'chalk';
// merged into upper import
import { getAppName } from '../generator/outputs';
import { createIncrementalBuilder } from './incremental';

function formatBanner(info: {
  appName: string;
  apiPort: number;
  hasPages: boolean;
  nextPort?: number;
  theme: boolean;
  prismaClient: boolean;
  enableCors: boolean;
  watchPattern: string;
  routeCount: number;
  prismaHint: boolean;
}) {
  const lines: string[] = [];
  lines.push(`App: ${info.appName}`);
  lines.push(`API:  http://localhost:${info.apiPort}  (routes: ${info.routeCount})`);
  if (info.hasPages) lines.push(`Web:  http://localhost:${info.nextPort || 3000}`);
  lines.push(`Theme: ${info.theme ? '✓' : '✗'}   Prisma: ${info.prismaClient ? '✓' : '✗'}${info.prismaHint ? ' (run prisma generate)' : ''}`);
  lines.push(`Watching: ${info.watchPattern}`);
  lines.push(`CORS: ${info.enableCors ? 'on' : 'off'}  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  lines.push(`Ctrl+C to stop`);
  const width = Math.max(...lines.map(l => l.length)) + 2;
  const top = '┌' + '─'.repeat(width) + '┐';
  const bottom = '└' + '─'.repeat(width) + '┘';
  const body = lines.map(l => '│ ' + l.padEnd(width - 2, ' ') + '│').join('\n');
  return chalk.cyanBright(top + '\n' + body + '\n' + bottom);
}

export async function dev(opts: { srcDir: string; debug?: boolean; errorFormat?: ErrorOutputFormat; quiet?: boolean; logFile?: string }) {
  const fileMap = new Map<string, string>();
  let logStream: import('fs').WriteStream | null = null;
  if (opts.logFile) {
    try {
      const { createWriteStream, mkdirSync } = await import('fs');
      const { dirname } = await import('path');
      mkdirSync(dirname(opts.logFile), { recursive: true });
      logStream = createWriteStream(opts.logFile, { flags: 'a' });
      const stamp = new Date().toISOString();
      logStream.write(`\n=== locus dev session ${stamp} ===\n`);
    } catch {/* ignore log file errors */}
  }
  const logMirror = (chunk: string) => { if (logStream) logStream.write(chunk); };
  // initial build
  let buildMeta: any = { meta: { hasPages: false } };
  try {
    buildMeta = await buildProject({ srcDir: opts.srcDir, debug: opts.debug });
  } catch (e) {
    if (e instanceof LocusError) {
  reportError(e, fileMap, opts.errorFormat);
    } else if (e && (e as any).cause instanceof LocusError) {
  reportError((e as any).cause as LocusError, fileMap, opts.errorFormat);
    }
  }
  // start next.js and express servers (stubbed)
  const apiPort = Number(process.env.API_PORT || process.env.PORT) || 3001;
  const generatedDir = join(opts.srcDir, 'generated');
  const pkgInGenerated = existsSync(join(generatedDir, 'package.json'));
  const rootPkg = existsSync(join(opts.srcDir, 'package.json'));
  // Choose working directory for spawning processes
  const workDir = pkgInGenerated ? generatedDir : (rootPkg ? opts.srcDir : generatedDir);

  // Auto install dependencies if needed (skip in tests or if node_modules exists)
  await ensureDependencies(workDir, { quiet: opts.quiet, log: logMirror });

  if (!opts.quiet) process.stdout.write(chalk.gray(`[locus][dev] starting API on :${apiPort} (cwd=${relative(opts.srcDir, workDir) || '.'})\n`));
  logMirror(`[locus][dev] starting API on :${apiPort} (cwd=${workDir})\n`);
  const apiProc = spawnApi(opts.srcDir, workDir, { quiet: opts.quiet, log: logMirror });
  let nextProc: any = { stdout: { on() {} }, kill() {} };
  if (buildMeta?.meta?.hasPages) {
    if (!opts.quiet) process.stdout.write(chalk.gray(`[locus][dev] starting Next dev server on :3000 (cwd=${relative(opts.srcDir, workDir) || '.'})\n`));
    logMirror('[locus][dev] starting Next dev server on :3000\n');
    nextProc = spawnNext(workDir);
  }
  const markStarted = new Set<string>();
  const watchChild = (name: string, proc: any) => {
    proc.stdout.on('data', (d: Buffer) => {
      logMirror(d.toString());
      if (!markStarted.has(name)) {
        if (!opts.quiet) process.stdout.write(chalk.green(`[locus][dev] ${name} up`)+"\n");
        logMirror(`[locus][dev] ${name} up\n`);
        markStarted.add(name);
      }
    });
    proc.stderr?.on('data', (d: Buffer) => {
      logMirror(d.toString());
      if (!opts.quiet) process.stderr.write(d.toString());
      if (/ERR_MODULE_NOT_FOUND/.test(d.toString()) && /routes\//.test(d.toString())) {
        const hint = '[locus][dev] hint: route file missing. Try re-running `locus build` or check generated/routes contents.';
        logMirror(hint + '\n');
        if (!opts.quiet) process.stdout.write(chalk.yellow(hint) + '\n');
      }
    });
    proc.on('exit', (code: number) => {
      const line = `[locus][dev] ${name} exited code ${code}`;
      if (!opts.quiet) process.stdout.write(chalk.red(line)+"\n");
      logMirror(line + '\n');
    });
  };
  watchChild('api', apiProc);
  if (buildMeta?.meta?.hasPages) watchChild('next', nextProc);
  nextProc.stdout.on('data', () => {});
  apiProc.stdout.on('data', () => {});

  // watch .locus files to trigger incremental rebuilds
  const chokidar = require('chokidar');
  const watcher = chokidar.watch('**/*.locus', { cwd: opts.srcDir, ignoreInitial: false, persistent: true, depth: 99 });
  const inc = createIncrementalBuilder({
    srcDir: opts.srcDir,
    outDir: join(opts.srcDir, 'generated'),
    fileMap,
  });
  const initialFiles = collectLocusFiles(opts.srcDir);
  try {
    await inc.init(initialFiles);
  } catch (e) {
    if (e instanceof LocusError) {
  reportError(e, fileMap, opts.errorFormat);
    } else if (e && (e as any).cause instanceof LocusError) {
  reportError((e as any).cause as LocusError, fileMap, opts.errorFormat);
    }
  }
  const debounce = createDebounce(100);
  const timed = async (label: string, fn: () => Promise<void>) => {
    const s = Date.now();
    try {
      await fn();
    } catch (e) {
      if (e instanceof LocusError) {
        reportError(e, fileMap, opts.errorFormat);
      } else if (e && (e as any).cause instanceof LocusError) {
        reportError((e as any).cause as LocusError, fileMap, opts.errorFormat);
      }
    }
    if (opts.debug) {
      console.log(`[locus][dev][${label}]`, { ms: Date.now() - s });
    }
  };
  watcher.on('add', (rel: string) => debounce(() => timed('add', () => inc.update(join(opts.srcDir, rel)))));
  watcher.on('change', (rel: string) => debounce(() => timed('change', () => inc.update(join(opts.srcDir, rel)))));
  watcher.on('unlink', (rel: string) => debounce(() => timed('unlink', () => inc.remove(join(opts.srcDir, rel)))));
  watcher.on('addDir', () => {});
  watcher.on('unlinkDir', () => {});
  watcher.on('error', () => {});

  // graceful shutdown
  const shutdown = () => {
  if (!opts.quiet) console.log(chalk.gray('[locus][dev] shutting down...'));
  logMirror('[locus][dev] shutting down...\n');
    try { watcher.close(); } catch {}
    try { nextProc.kill(); } catch {}
    try { apiProc.kill(); } catch {}
  if (!opts.quiet) console.log(chalk.gray('[locus][dev] bye'));
  logMirror('[locus][dev] bye\n');
  if (logStream) { try { logStream.end(); } catch {} }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // After everything set up, print banner
  try {
    const appName = getAppName(opts.srcDir);
    // route count: count generated/routes/*.ts (exclude server.ts)
    let routeCount = 0;
    const routesDir = join(opts.srcDir, 'generated', 'routes');
    try { routeCount = readdirSync(routesDir).filter(f => f.endsWith('.ts')).length; } catch {}
    const theme = existsSync(join(opts.srcDir, 'generated', 'theme.css'));
    let prismaClient = true; let prismaHint = false;
    try { require.resolve('@prisma/client'); } catch { prismaClient = false; prismaHint = true; }
    const banner = formatBanner({
      appName,
      apiPort,
      hasPages: !!buildMeta?.meta?.hasPages,
      nextPort: 3000,
      theme,
      prismaClient,
      prismaHint,
      enableCors: process.env.ENABLE_CORS === '1',
      watchPattern: '**/*.locus',
      routeCount,
    });
  if (!opts.quiet) process.stdout.write(banner + '\n');
  logMirror(banner + '\n');
  } catch {/* ignore banner errors */}
}

async function ensureDependencies(dir: string, io: { quiet?: boolean; log: (s: string)=>void }) {
  if (process.env.LOCUS_TEST_DISABLE_SPAWN === '1') return; // skip in tests
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return;
  const nm = join(dir, 'node_modules');
  if (existsSync(nm)) return; // already installed
  const line = '[locus][dev] installing dependencies (first run)...';
  if (!io.quiet) process.stdout.write(chalk.gray(line + '\n'));
  io.log(line + '\n');
  await new Promise<void>((resolve) => {
    const proc = spawnSafe('npm', ['install', '--no-audit', '--no-fund'], dir);
    proc.stdout.on('data', (d: Buffer) => io.log(d.toString()));
    proc.stderr.on('data', (d: Buffer) => io.log(d.toString()));
    proc.on('exit', () => resolve());
    proc.on('error', () => resolve());
  });
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

function spawnSafe(cmd: string, args: string[], cwd?: string) {
  // Cross-platform process spawn helper with optional cwd
  if (process.env.LOCUS_TEST_DISABLE_SPAWN === '1') {
    // Return a mock-like minimal event emitter object for tests
    const { EventEmitter } = require('events');
    const fake: any = new EventEmitter();
    fake.stdout = new EventEmitter();
    fake.stderr = new EventEmitter();
    fake.kill = () => { fake.emit('exit', 0); };
    setTimeout(() => fake.stdout.emit('data', Buffer.from('test')), 5);
    return fake;
  }
  const proc = spawn(cmd, args, { stdio: 'pipe', cwd, shell: process.platform === 'win32' });
  return proc;
}

function createDebounce(ms: number) {
  let t: any;
  return (fn: () => void) => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

function spawnNext(generatedDir: string) {
  const cmd = process.env.LOCUS_NEXT_CMD;
  if (cmd) return spawnSafe(cmd, [], generatedDir);
  // Use correct script name dev:next (generated package.json)
  return spawnSafe('npm', ['run', 'dev:next'], generatedDir);
}

function spawnApi(_srcDir: string, workDir: string, opts: { quiet?: boolean; log?: (s: string)=>void }) {
  const serverTs = join(workDir, 'server.ts');
  if (!existsSync(serverTs)) {
    const msg = '[locus][dev] missing server.ts in ' + workDir;
    if (!opts.quiet) process.stdout.write(msg + '\n');
    opts.log?.(msg + '\n');
  }
  return spawnSafe('npm', ['run', 'dev:api'], workDir);
}
