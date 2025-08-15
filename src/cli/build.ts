import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parseLocus } from '../parser';
import { mergeAsts } from '../parser/merger';
import { generatePrismaSchema } from '../generator/prisma';
import { generateExpressApi } from '../generator/express';

export async function buildProject(opts: { srcDir: string; outDir?: string }) {
  const srcDir = opts.srcDir;
  const outDir = opts.outDir || join(srcDir, 'generated');

  const files = readdirSync(srcDir).filter(f => f.endsWith('.locus'));
  const asts = files.map(f => parseLocus('' + f)); // in real impl, read file contents
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
