import { Entity } from '../ast';

export function generateExpressApi(entities: Entity[]): Record<string, string> {
  const files: Record<string, string> = {};
  for (const e of entities) {
    const lc = e.name.charAt(0).toLowerCase() + e.name.slice(1);
    const route = `import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
export const router = Router()

// route declarations
router.get('/${lc}')
router.get('/${lc}/:id')
router.post('/${lc}')
router.put('/${lc}/:id')
router.delete('/${lc}/:id')

// handlers
router.get('/${lc}', async (req, res) => {
  const rows = await prisma.${lc}.findMany()
  res.json(rows)
})

router.get('/${lc}/:id', async (req, res) => {
  const id = Number(req.params.id)
  const row = await prisma.${lc}.findUnique({ where: { id } })
  if (!row) return res.status(404).end()
  res.json(row)
})

router.post('/${lc}', async (req, res) => {
  const created = await prisma.${lc}.create({ data: req.body })
  res.status(201).json(created)
})

router.put('/${lc}/:id', async (req, res) => {
  const id = Number(req.params.id)
  const updated = await prisma.${lc}.update({ where: { id }, data: req.body })
  res.json(updated)
})

router.delete('/${lc}/:id', async (req, res) => {
  const id = Number(req.params.id)
  await prisma.${lc}.delete({ where: { id } })
  res.status(204).end()
})
`;
    files[`routes/${lc}.ts`] = route;
  }
  // Optional: basic app bootstrap
  files['server.ts'] = `import express from 'express'\nimport bodyParser from 'body-parser'\nconst app = express()\napp.use(bodyParser.json())\n// TODO: mount routers\nexport default app\n`;
  return files;
}
