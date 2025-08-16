import { Entity } from '../ast';

export function generateExpressApi(entities: Entity[]): Record<string, string> {
  const files: Record<string, string> = {};
  const mounts: string[] = [];
  const sorted = [...entities].sort((a, b) => a.name.localeCompare(b.name));
  for (const e of sorted) {
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
  try {
    const skip = req.query.skip ? Number(req.query.skip) : undefined
    const take = req.query.take ? Number(req.query.take) : undefined
    let where: any = undefined
    if (req.query.where) {
      try { where = typeof req.query.where === 'string' ? JSON.parse(req.query.where) : req.query.where } catch { return res.status(400).json({ error: 'Invalid where JSON' }) }
    }
    const rows = await prisma.${lc}.findMany({ where, skip, take })
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' })
  }
})

router.get('/${lc}/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const row = await prisma.${lc}.findUnique({ where: { id } })
    if (!row) return res.status(404).end()
    res.json(row)
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' })
  }
})

router.post('/${lc}', async (req, res) => {
  try {
    const created = await prisma.${lc}.create({ data: req.body })
    res.status(201).json(created)
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Create failed' })
  }
})

router.put('/${lc}/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const updated = await prisma.${lc}.update({ where: { id }, data: req.body })
    res.json(updated)
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Update failed' })
  }
})

router.delete('/${lc}/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.${lc}.delete({ where: { id } })
    res.status(204).end()
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Delete failed' })
  }
})
`;
    files[`routes/${lc}.ts`] = route;
    mounts.push(lc);
  }
  // Optional: basic app bootstrap
  const imports = mounts.map(n => `import { router as ${n}Router } from './routes/${n}'`).join('\n');
  const uses = mounts.map(n => `app.use('/${n}', ${n}Router)`).join('\n');
  files['server.ts'] = `import express from 'express'\nimport bodyParser from 'body-parser'\n${imports}\nconst app = express()\napp.use(bodyParser.json())\n${uses}\nexport default app\n`;
  return files;
}
