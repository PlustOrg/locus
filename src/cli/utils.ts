// Utility functions for CLI operations

import { dirname } from 'path';
import { exec } from 'child_process';
import { readdirSync, statSync, promises as fsp, existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

/**
 * Recursively find all .locus files in a directory.
 */
export function findLocusFiles(dir: string): string[] {
  let entries: any;
  try {
    entries = readdirSync(dir, { withFileTypes: true } as any);
  } catch {
    entries = readdirSync(dir);
  }
  if (Array.isArray(entries) && typeof entries[0] === 'string') {
    return (entries as string[])
      .map(name => join(dir, name))
      .filter(p => p.endsWith('.locus'));
  }
  const results: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory && entry.isDirectory()) {
      results.push(...findLocusFiles(full));
    } else if (entry.isFile && entry.isFile() && full.endsWith('.locus')) {
      results.push(full);
    } else if (!entry.isDirectory && !entry.isFile) {
      try {
        const st = statSync(full);
        if (st.isDirectory()) results.push(...findLocusFiles(full));
        else if (st.isFile() && full.endsWith('.locus')) results.push(full);
      } catch {
        // ignore
      }
    }
  }
  return results;
}

/**
 * Recursively collect all .locus files in a directory.
 */
export function collectLocusFiles(dir: string): string[] {
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

/**
 * Limit concurrency for async operations.
 */
export function pLimit(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  const next = () => {
    if (active >= concurrency) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    job();
  };
  return function <T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        Promise.resolve(fn()).then(
          (v) => { active--; resolve(v); next(); },
          (e) => { active--; reject(e); next(); }
        );
      };
      queue.push(run);
      next();
    });
  };
}

/**
 * Safe mkdir (async preferred, fallback to sync).
 */
export async function safeMkdir(dir: string) {
  try {
    if ((fsp as any)?.mkdir) return await (fsp as any).mkdir(dir, { recursive: true });
  } catch {/* ignore */}
  try { mkdirSync(dir, { recursive: true }); } catch {/* ignore */}
}

/**
 * Safe write file (async preferred, fallback to sync).
 */
export async function safeWrite(path: string, content: string) {
  ensureDir(path);
  try {
    if ((fsp as any)?.writeFile) return await (fsp as any).writeFile(path, content, 'utf8');
  } catch {/* fall through to sync */}
  writeFileSync(path, content);
}

/**
 * Cross-platform process spawn helper with optional cwd.
 */
export function spawnSafe(cmd: string, args: string[], cwd?: string) {
  if (process.env.LOCUS_TEST_DISABLE_SPAWN === '1') {
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

/**
 * Debounce function for file watching.
 */
export function createDebounce(ms: number) {
  let t: any;
  return (fn: () => void) => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

/**
 * Run a shell command asynchronously.
 */
export function execAsync(cmd: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    exec(cmd, (err: Error | null) => {
      if (err) reject(err); else resolve();
    });
  });
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export function ensureDir(p: string) {
  const dir = dirname(p);
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  } catch {
    try { mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
  }
}

/**
 * Write a file safely, ensuring its directory exists.
 */
export function writeFileSafe(p: string, content: string) {
  ensureDir(p);
  writeFileSync(p, content);
}

/**
 * Best-effort recursive removal with retries to avoid transient EACCES/EBUSY/ENOTEMPTY errors
 * occasionally observed on macOS tmp dirs under rapid test teardown.
 */
export function safeRemove(target: string, opts: { retries?: number; delayMs?: number } = {}) {
  const { retries = 5, delayMs = 30 } = opts;
  for (let i = 0; i <= retries; i++) {
  try { rmSync(target, { recursive: true, force: true }); return; }
    catch (e: any) {
      const code = e?.code || '';
      if (!/EACCES|EBUSY|ENOTEMPTY/.test(code)) return; // non-transient -> abort
      if (i === retries) return; // give up silently
      // Busy wait minimal sleep (Atomics avoids event loop scheduling jitter for tiny delays)
      try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs); } catch { /* ignore */ }
    }
  }
}
