import { readdirSync, writeFileSync, mkdirSync, existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { parseLocus } from '../parser';
import { mergeAsts } from '../parser/merger';
import { generatePrismaSchema } from '../generator/prisma';
import { generateExpressApi } from '../generator/express';
import { BuildError, GeneratorError } from '../errors';
import { generateReactComponent, generateReactPage } from '../generator/react';

export async function buildProject(opts: { srcDir: string; outDir?: string }) {
  const srcDir = opts.srcDir;
  const outDir = opts.outDir || join(srcDir, 'generated');

  let files: string[];
  try { files = findLocusFiles(srcDir); } catch (e) { throw new BuildError(`Failed to read source directory: ${srcDir}`, e); }
  const asts = files.map(fp => {
    try {
      const content = typeof readFileSync === 'function' ? readFileSync(fp, 'utf8') : String(fp);
      return parseLocus(content as any);
    } catch (e) {
      throw new BuildError(`Failed to parse ${fp}: ${(e as any)?.message || e}`, e);
    }
  });
  let merged;
  try {
    merged = mergeAsts(asts);
  } catch (e) {
    throw new BuildError(`Failed to merge ASTs: ${(e as any)?.message || e}`, e);
  }

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
    for (const [p, c] of Object.entries(routes)) {
      const full = join(outDir, p);
      const dir = full.split('/').slice(0, -1).join('/');
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(full, c);
    }
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
  for (const p of sortedPages) {
    try {
      const code = generateReactPage(p);
      writeFileSync(join(pagesDir, `${p.name}.tsx`), code);
    } catch (e) {
      throw new GeneratorError(`Failed generating React page '${p.name}'`, e);
    }
  }
  const sortedComps = [...(merged.components as any[])].sort((a, b) => a.name.localeCompare(b.name));
  for (const c of sortedComps) {
    try {
      const code = generateReactComponent(c);
      writeFileSync(join(compsDir, `${c.name}.tsx`), code);
    } catch (e) {
      throw new GeneratorError(`Failed generating React component '${c.name}'`, e);
    }
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
