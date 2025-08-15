import { readdirSync, writeFileSync, mkdirSync, existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { parseLocus } from '../parser';
import { mergeAsts } from '../parser/merger';
import { generatePrismaSchema } from '../generator/prisma';
import { generateExpressApi } from '../generator/express';

export async function buildProject(opts: { srcDir: string; outDir?: string }) {
  const srcDir = opts.srcDir;
  const outDir = opts.outDir || join(srcDir, 'generated');

  const files = findLocusFiles(srcDir);
  const asts = files.map(fp => {
    const content = typeof readFileSync === 'function' ? readFileSync(fp, 'utf8') : String(fp);
    return parseLocus(content as any);
  });
  const merged = mergeAsts(asts);

  // Prisma
  const schema = generatePrismaSchema(merged.database);
  const prismaDir = join(outDir, 'prisma');
  if (!existsSync(prismaDir)) mkdirSync(prismaDir, { recursive: true });
  writeFileSync(join(prismaDir, 'schema.prisma'), schema);

  // Express
  const routes = generateExpressApi(merged.database.entities as any);
  for (const [p, c] of Object.entries(routes)) {
    const full = join(outDir, p);
    const dir = full.split('/').slice(0, -1).join('/');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(full, c);
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
