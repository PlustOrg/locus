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

// GET /${lc}
router.get('/${lc}', async (req, res) => {
  try {
  const skip = req.query.skip !== undefined ? Number(req.query.skip) : undefined
  const take = req.query.take !== undefined ? Number(req.query.take) : undefined
    let where: any = undefined
    if (req.query.where) {
      try { where = typeof req.query.where === 'string' ? JSON.parse(req.query.where) : req.query.where } catch { return res.status(400).json({ error: 'Invalid where JSON' }) }
    }
  if (skip !== undefined && Number.isNaN(skip)) return res.status(400).json({ error: 'skip must be a number' })
  if (take !== undefined && Number.isNaN(take)) return res.status(400).json({ error: 'take must be a number' })
  const rows = await prisma.${lc}.findMany({ where, skip, take })
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' })
  }
})

// GET /${lc}/:id
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

// POST /${lc}
router.post('/${lc}', async (req, res) => {
  try {
  // TODO(validation): derive schema from entity definition and validate body
  const created = await prisma.${lc}.create({ data: req.body })
    res.status(201).json(created)
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Create failed' })
  }
})

// PUT /${lc}/:id
router.put('/${lc}/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'id must be a number' })
  // TODO(validation): derive schema from entity definition and validate body
  const updated = await prisma.${lc}.update({ where: { id }, data: req.body })
    res.json(updated)
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Update failed' })
  }
})

// DELETE /${lc}/:id
router.delete('/${lc}/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'id must be a number' })
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
  files['server.ts'] = `import express from 'express'
import cors from 'cors'
import path from 'path'
${imports}

const app = express()
// JSON body parsing
app.use(express.json())
// Conditional CORS (enable by setting ENABLE_CORS=1)
if (process.env.ENABLE_CORS === '1') { app.use(cors()) }
// Static assets (theme, public files)
const publicDir = path.join(__dirname, 'next-app', 'public')
app.use(express.static(publicDir))
${uses}

export function startServer(port: number = Number(process.env.PORT) || 3001) {
  return app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log('[locus][api] listening on :' + port)
  })
}

export default app
`;
  return files;
}
