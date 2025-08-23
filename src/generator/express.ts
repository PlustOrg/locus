import { Entity } from '../ast';

function pluralize(name: string): string {
  if (name.endsWith('y') && !/[aeiou]y$/i.test(name)) return name.slice(0, -1) + 'ies';
  if (name.endsWith('s')) return name + 'es';
  return name + 's';
}
export function generateExpressApi(entities: Entity[], opts?: { pluralizeRoutes?: boolean }): Record<string, string> {
  const files: Record<string, string> = {};
  const mounts: string[] = [];
  const sorted = [...entities].sort((a, b) => a.name.localeCompare(b.name));
  for (const e of sorted) {
    const base = e.name.charAt(0).toLowerCase() + e.name.slice(1);
    const routeBase = opts?.pluralizeRoutes ? pluralize(base) : base;
  const route = `import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
export const router = Router()

// GET /${routeBase}
router.get('/${routeBase}', async (req, res) => {
  try {
  const skip = req.query.skip !== undefined ? Number(req.query.skip) : undefined
  const take = req.query.take !== undefined ? Number(req.query.take) : undefined
    let where: any = undefined
    if (req.query.where) {
      try { where = typeof req.query.where === 'string' ? JSON.parse(req.query.where) : req.query.where } catch { return res.status(400).json({ error: 'Invalid where JSON' }) }
    }
  if (skip !== undefined && Number.isNaN(skip)) return res.status(400).json({ error: 'skip must be a number' })
  if (take !== undefined && Number.isNaN(take)) return res.status(400).json({ error: 'take must be a number' })
  const rows = await prisma.${base}.findMany({ where, skip, take })
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' })
  }
})

// GET /${routeBase}/:id
router.get('/${routeBase}/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
  const row = await prisma.${base}.findUnique({ where: { id } })
    if (!row) return res.status(404).end()
    res.json(row)
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' })
  }
})

// POST /${routeBase}
router.post('/${routeBase}', async (req, res) => {
  try {
  // TODO(validation): derive schema from entity definition and validate body
  const created = await prisma.${base}.create({ data: req.body })
    res.status(201).json(created)
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Create failed' })
  }
})

// PUT /${routeBase}/:id
router.put('/${routeBase}/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'id must be a number' })
  // TODO(validation): derive schema from entity definition and validate body
  const updated = await prisma.${base}.update({ where: { id }, data: req.body })
    res.json(updated)
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Update failed' })
  }
})

// DELETE /${routeBase}/:id
router.delete('/${routeBase}/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(400).json({ error: 'id must be a number' })
  await prisma.${base}.delete({ where: { id } })
    res.status(204).end()
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Delete failed' })
  }
})
`;
  files[`routes/${base}.ts`] = route;
  mounts.push(base);
  }
  // Optional: basic app bootstrap
  // Use CommonJS style dynamic requires to avoid extension resolution issues under differing module loaders
  const imports = mounts.map(n => `const { router: ${n}Router } = require('./routes/${n}.ts')`).join('\n');
  const uses = mounts.map(n => `app.use('/${opts?.pluralizeRoutes ? pluralize(n) : n}', ${n}Router)`).join('\n');
  files['server.ts'] = `/* eslint-disable */
import express from 'express'
import cors from 'cors'
import path from 'path'
${imports}

const app = express()
app.use(express.json())
if (process.env.ENABLE_CORS === '1') { app.use(cors()) }
const publicDir = path.join(__dirname, 'next-app', 'public')
try { app.use(express.static(publicDir)) } catch {}
// Basic health/readiness endpoints
app.get('/healthz', (req, res) => { res.json({ ok: true, uptime: process.uptime(), ts: Date.now() }) })
let startedAt = Date.now();
app.get('/readyz', (req, res) => { res.json({ ready: true, uptime: process.uptime(), startedAt }) })
${uses}

export function startServer(port: number = Number(process.env.API_PORT || process.env.PORT) || 3001) {
  return app.listen(port, () => { console.log('[locus][api] listening on :' + port); console.log('[locus][api] ready'); })
}
export default app
// Auto-start when run directly (dev:api script)
if (require.main === module) {
  startServer();
}
`;
  return files;
}
