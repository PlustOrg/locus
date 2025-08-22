import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { parseLocus } from '../parser';
import { mergeAsts } from '../parser/merger';
import { buildOutputArtifacts, buildPackageJson, buildGeneratedReadme, getAppName } from '../generator/outputs';
import { BuildError } from '../errors';

export function createIncrementalBuilder(opts: {
  srcDir: string;
  outDir: string;
  fileMap: Map<string, string>;
}) {
  const cache = new Map<string, ReturnType<typeof parseLocus>>();

  function ensureDir(p: string) {
    const dir = dirname(p);
    try {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    } catch {
      // Best-effort for missing parent paths in mocked envs
      try { mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
    }
  }

  function writeFileSafe(p: string, content: string) {
    ensureDir(p);
    writeFileSync(p, content);
  }

  function writePackageJson(hasPages: boolean) {
    const pkgPath = join(opts.outDir, 'package.json');
    if (existsSync(pkgPath)) return; // one-time
    const appName = getAppName(opts.srcDir);
    writeFileSafe(pkgPath, buildPackageJson(hasPages, appName));
    const readmePath = join(opts.outDir, 'README.md');
    if (!existsSync(readmePath)) writeFileSafe(readmePath, buildGeneratedReadme());
  }

  const lastWritten = new Map<string, string>();
  let totalWrites = 0;
  let lastChangeTime = Date.now();

  // (previous listGeneratedFiles removed as unused)

  function rebuildAll() {
    // Merge
    let merged;
    try { merged = mergeAsts(Array.from(cache.values())); }
    catch (e) { throw new BuildError(`Failed to merge ASTs: ${(e as any)?.message || e}`, e); }

    const outDir = opts.outDir;
    // In mocked dev tests, outDir may not be writable; guard with try/catch
    try {
  const changed: string[] = [];
    const { files: artifacts, meta } = buildOutputArtifacts(merged, { srcDir: opts.srcDir });
  for (const [rel, content] of Object.entries(artifacts)) {
      const full = join(outDir, rel);
      if (lastWritten.get(full) !== content) {
        writeFileSafe(full, content);
        lastWritten.set(full, content);
        changed.push(full);
    totalWrites++;
      }
    }
    writePackageJson(meta.hasPages);
    if (changed.length) {
      const now = Date.now();
      const delta = now - lastChangeTime;
      lastChangeTime = now;
      if (process.env.LOCUS_DEBUG) {
        process.stdout.write('[locus][dev][changed] ' + changed.map(f => f.replace(opts.outDir + '/', '')).join(', ') + `\n[locus][dev][timing] batch=${changed.length} total=${totalWrites} dt=${delta}ms` + '\n');
      } else {
        process.stdout.write(`[locus][dev] regenerated ${changed.length} file${changed.length === 1 ? '' : 's'}\n`);
      }
    }
    } catch {
      // ignore write errors in dev watcher bootstrap
    }
  }

  return {
    async init(files: string[]) {
      for (const fp of files) {
        try {
          const content = readFileSync(fp, 'utf8');
          opts.fileMap.set(fp, content);
          cache.set(fp, parseLocus(content, fp));
        } catch (e) {
          // Preserve rich location info for parser/validation errors
          if (e && (e as any).code) throw e;
          throw new BuildError(`Failed to parse ${fp}: ${(e as any)?.message || e}`, e);
        }
      }
      rebuildAll();
    },
    async update(filePath: string) {
      try {
        const content = readFileSync(filePath, 'utf8');
        opts.fileMap.set(filePath, content);
        cache.set(filePath, parseLocus(content, filePath));
      } catch (e) {
        throw e;
      }
      rebuildAll();
    },
    async remove(filePath: string) {
      cache.delete(filePath);
      rebuildAll();
    }
  };
}
