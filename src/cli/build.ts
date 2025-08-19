import { readdirSync, writeFileSync, mkdirSync, existsSync, readFileSync, statSync } from 'fs';
import { promises as fsp } from 'fs';
import { join, dirname } from 'path';
import { parseLocus } from '../parser';
import { mergeAsts } from '../parser/merger';
import { validateUnifiedAst } from '../validator/validate';
import { generatePrismaSchema } from '../generator/prisma';
import { generateExpressApi } from '../generator/express';
import { BuildError, GeneratorError } from '../errors';
import { generateReactComponent, generateReactPage } from '../generator/react';
import { generateCssVariables } from '../generator/theme';
import { generateNextApp } from '../generator/next';

export async function buildProject(opts: { srcDir: string; outDir?: string; debug?: boolean }) {
  const srcDir = opts.srcDir;
  const outDir = opts.outDir || join(srcDir, 'generated');
  const debug = !!opts.debug;
  const t0 = Date.now();

  let files: string[];
  try { files = findLocusFiles(srcDir); } catch (e) { throw new BuildError(`Failed to read source directory: ${srcDir}`, e); }
  const tParse0 = Date.now();
  const asts = files.map(fp => {
    try {
      const content = typeof readFileSync === 'function' ? readFileSync(fp, 'utf8') : String(fp);
      return parseLocus(content as any, fp);
    } catch (e) {
      throw new BuildError(`Failed to parse ${fp}: ${(e as any)?.message || e}`, e);
    }
  });
  const tParse1 = Date.now();
  let merged;
  try {
    merged = mergeAsts(asts);
  } catch (e) {
    throw new BuildError(`Failed to merge ASTs: ${(e as any)?.message || e}`, e);
  }
  // Validate unified AST
  try { validateUnifiedAst(merged); } catch (e) { throw e; }
  const tMerge1 = Date.now();

  // Prisma
  try {
    const schema = generatePrismaSchema(merged.database);
    const prismaDir = join(outDir, 'prisma');
    if (!existsSync(prismaDir)) mkdirSync(prismaDir, { recursive: true });
    writeFileSync(join(prismaDir, 'schema.prisma'), schema);
  } catch (e) {
    throw new GeneratorError('Failed generating Prisma schema', e);
  }

  // Express
  try {
    const routes = generateExpressApi(merged.database.entities as any);
    const entries = Object.entries(routes).sort(([a], [b]) => a.localeCompare(b));
    const limit = pLimit(4);
    await Promise.all(entries.map(([p, c]) => limit(async () => {
      const full = join(outDir, p);
      const dir = dirname(full);
      await safeMkdir(dir);
      await safeWrite(full, c);
    })));
  } catch (e) {
    throw new GeneratorError('Failed generating Express API', e);
  }

  // React (pages & components)
  const reactBase = join(outDir, 'react');
  const pagesDir = join(reactBase, 'pages');
  const compsDir = join(reactBase, 'components');
  if (!existsSync(pagesDir)) mkdirSync(pagesDir, { recursive: true });
  if (!existsSync(compsDir)) mkdirSync(compsDir, { recursive: true });
  // ensure stable output ordering
  const sortedPages = [...(merged.pages as any[])].sort((a, b) => a.name.localeCompare(b.name));
  {
  const limit = pLimit(4);
  await Promise.all(sortedPages.map(p => limit(async () => {
      try {
    const code = generateReactPage(p);
    await safeWrite(join(pagesDir, `${p.name}.tsx`), code);
      } catch (e) {
        throw new GeneratorError(`Failed generating React page '${p.name}'`, e);
      }
    })));
  }

  // Theme CSS from design_system
  try {
    const css = generateCssVariables(merged.designSystem);
    // Write to outDir root (Next app will import from /theme.css)
    writeFileSync(join(outDir, 'theme.css'), css);
  } catch {/* ignore optional */}

  // Next.js minimal app scaffolding (app/ directory routing)
  try {
    const nextFiles = generateNextApp(merged.pages as any);
    for (const [rel, content] of Object.entries(nextFiles)) {
      const full = join(outDir, rel);
      const dir = dirname(full);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(full, content);
    }
  } catch {/* optional */}
  const sortedComps = [...(merged.components as any[])].sort((a, b) => a.name.localeCompare(b.name));
  {
  const limit = pLimit(4);
  await Promise.all(sortedComps.map(c => limit(async () => {
      try {
    const code = generateReactComponent(c);
    await safeWrite(join(compsDir, `${c.name}.tsx`), code);
      } catch (e) {
        throw new GeneratorError(`Failed generating React component '${c.name}'`, e);
      }
    })));
  }

  if (debug) {
    const t1 = Date.now();
    const timings = {
      files: files.length,
      parseMs: tParse1 - tParse0,
      mergeMs: tMerge1 - tParse1,
      generateMs: t1 - tMerge1,
      totalMs: t1 - t0,
    };
  process.stdout.write('[locus][build][timings] ' + JSON.stringify(timings) + '\n');
  }

  return { outDir };
}

function findLocusFiles(dir: string): string[] {
  let entries: any;
  try {
    entries = readdirSync(dir, { withFileTypes: true } as any);
  } catch {
    entries = readdirSync(dir);
  }
  // If mocked fs returns string[]
  if (Array.isArray(entries) && typeof entries[0] === 'string') {
    return (entries as string[])
      .map(name => join(dir, name))
      .filter(p => p.endsWith('.locus'));
  }
  // Real dirents path
  const results: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory && entry.isDirectory()) {
      results.push(...findLocusFiles(full));
    } else if (entry.isFile && entry.isFile() && full.endsWith('.locus')) {
      results.push(full);
    } else if (!entry.isDirectory && !entry.isFile) {
      // Fallback for environments lacking isFile/isDirectory on dirent
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

function pLimit(concurrency: number) {
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

async function safeMkdir(dir: string) {
  try {
    if ((fsp as any)?.mkdir) return await (fsp as any).mkdir(dir, { recursive: true });
  } catch {/* ignore */}
  try { mkdirSync(dir, { recursive: true }); } catch {/* ignore */}
}

async function safeWrite(path: string, content: string) {
  try {
    if ((fsp as any)?.writeFile) return await (fsp as any).writeFile(path, content, 'utf8');
  } catch {/* fall through to sync */}
  writeFileSync(path, content);
}
