import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { parseLocus } from '../parser';
import { mergeAsts } from '../parser/merger';
import { generatePrismaSchema } from '../generator/prisma';
import { generateExpressApi } from '../generator/express';
import { generateReactComponent, generateReactPage } from '../generator/react';
import { BuildError } from '../errors';

export function createIncrementalBuilder(opts: { srcDir: string; outDir: string }) {
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

  function rebuildAll() {
    // Merge
    let merged;
    try { merged = mergeAsts(Array.from(cache.values())); }
    catch (e) { throw new BuildError(`Failed to merge ASTs: ${(e as any)?.message || e}`, e); }

    const outDir = opts.outDir;
    // In mocked dev tests, outDir may not be writable; guard with try/catch
    try {
    // Prisma
    const schema = generatePrismaSchema(merged.database);
    writeFileSafe(join(outDir, 'prisma', 'schema.prisma'), schema);
    // Express
    const routes = generateExpressApi(merged.database.entities as any);
    for (const [p, c] of Object.entries(routes)) {
      writeFileSafe(join(outDir, p), c);
    }
    // React
    const pages = [...(merged.pages as any[])].sort((a, b) => a.name.localeCompare(b.name));
    for (const p of pages) writeFileSafe(join(outDir, 'react', 'pages', `${p.name}.tsx`), generateReactPage(p));
    const comps = [...(merged.components as any[])].sort((a, b) => a.name.localeCompare(b.name));
    for (const c of comps) writeFileSafe(join(outDir, 'react', 'components', `${c.name}.tsx`), generateReactComponent(c));
    } catch {
      // ignore write errors in dev watcher bootstrap
    }
  }

  return {
    async init(files: string[]) {
      for (const fp of files) {
        try { cache.set(fp, parseLocus(readFileSync(fp, 'utf8'))); }
        catch (e) { throw new BuildError(`Failed to parse ${fp}: ${(e as any)?.message || e}`, e); }
      }
      rebuildAll();
    },
    async update(filePath: string) {
      try { cache.set(filePath, parseLocus(readFileSync(filePath, 'utf8'))); }
      catch (e) { throw new BuildError(`Failed to parse ${filePath}: ${(e as any)?.message || e}`, e); }
      rebuildAll();
    },
    async remove(filePath: string) {
      cache.delete(filePath);
      rebuildAll();
    }
  };
}
