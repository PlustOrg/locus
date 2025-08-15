import { Entity } from '../ast';

export function generateExpressApi(entities: Entity[]): Record<string, string> {
  const files: Record<string, string> = {};
  for (const e of entities) {
    const lc = e.name.charAt(0).toLowerCase() + e.name.slice(1);
  const route = `import { Router } from 'express'\nimport { PrismaClient } from '@prisma/client'\nconst prisma = new PrismaClient()\nexport const router = Router()\n\n// route declarations\nrouter.get('/${lc}')\n\n// handlers\nrouter.get('/${lc}', async (req, res) => {\n  const rows = await prisma.${lc}.findMany()\n  res.json(rows)\n})\n`;
    files[`routes/${lc}.ts`] = route;
  }
  return files;
}
