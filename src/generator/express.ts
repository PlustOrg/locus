import { Entity, UploadPolicyAst } from '../ast';
import { generateValidationModules } from './validation';
import { generateUploadPolicyModules } from './uploads';

function pluralize(name: string): string {
  if (name.endsWith('y') && !/[aeiou]y$/i.test(name)) return name.slice(0, -1) + 'ies';
  if (name.endsWith('s')) return name + 'es';
  return name + 's';
}
export interface AuthConfig {
  adapterPath?: string;
  requireAuth?: boolean;
  jwtSecret?: string;
}

export function generateExpressApi(entities: Entity[], opts?: { pluralizeRoutes?: boolean; auth?: AuthConfig; pagesWithGuards?: { name: string; role: string }[], uploads?: UploadPolicyAst[] }): Record<string, string> {
  const files: Record<string, string> = {};
  // generate validation schemas first
  Object.assign(files, generateValidationModules(entities));
  if (opts?.uploads && opts.uploads.length) {
    Object.assign(files, generateUploadPolicyModules(opts.uploads));
  }
  const mounts: string[] = [];
  const sorted = [...entities].sort((a, b) => a.name.localeCompare(b.name));
  for (const e of sorted) {
    const base = e.name.charAt(0).toLowerCase() + e.name.slice(1);
    const routeBase = opts?.pluralizeRoutes ? pluralize(base) : base;
  const route = `import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { validate${e.name}Body, validate${e.name}Update } from '../validation/${e.name}'
import { validationErrorEnvelope } from '../runtime/validateRuntime'
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
  const validation = validate${e.name}Body(req.body, 'create');
  if (!validation.ok) return res.status(400).json(validationErrorEnvelope(validation.errors!));
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
  const validation = validate${e.name}Update(req.body);
  if (!validation.ok) return res.status(400).json(validationErrorEnvelope(validation.errors!));
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
  const guardLines: string[] = [];
  if (opts?.pagesWithGuards?.length) {
    guardLines.push('// page guard declarations');
    for (const pg of opts.pagesWithGuards) {
      guardLines.push(`// Guard page ${pg.name} requires role ${pg.role}`);
  // create stub endpoint illustrating guard enforcement
  guardLines.push(`app.get('/guard/${pg.name.toLowerCase()}', requireRole('${pg.role}'), (req,res)=> res.json({ ok: true, page: '${pg.name}' }))`);
    }
  }
  // Auth utilities generation (if requested)
  if (opts?.auth?.jwtSecret) {
  files['auth/authUtils.ts'] = `import crypto from 'crypto';\n\nconst secret = process.env.LOCUS_JWT_SECRET || ${JSON.stringify(opts.auth.jwtSecret)};\n\ninterface TokenOptions { expSeconds?: number }\ninterface TokenPayload { [k:string]: any; exp?: number }\nexport function generateToken(payload: TokenPayload, opts: TokenOptions = {}): string {\n  const bodyObj: TokenPayload = { ...payload };\n  if (opts.expSeconds) { bodyObj.exp = Math.floor(Date.now()/1000) + opts.expSeconds; }\n  const body = Buffer.from(JSON.stringify(bodyObj)).toString('base64url');\n  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');\n  return body + '.' + sig;\n}\nexport function verifyToken(token: string): TokenPayload | null {\n  const [body, sig] = token.split('.');\n  if (!body || !sig) return null;\n  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');\n  if (expected !== sig) return null;\n  try { const obj: TokenPayload = JSON.parse(Buffer.from(body,'base64url').toString('utf8')); if (obj.exp && obj.exp < Math.floor(Date.now()/1000)) return null; return obj; } catch { return null; }\n}\n`;
  }

  const authLines: string[] = [];
  if (opts?.auth?.adapterPath) {
    authLines.push(`// auth middleware injected\nimport * as authAdapter from '${opts.auth.adapterPath.replace(/\\/g,'/')}';`);
    authLines.push(`(app as any).authAdapter = authAdapter;`);
    authLines.push(`app.use(async function locusAuthMiddleware(req,res,next){\n  try {\n    const session = authAdapter.getSession ? await authAdapter.getSession(req,res) : null;\n    (req as any).auth = session;\n    (req as any).user = session;\n    if (${opts.auth.requireAuth ? 'true' : 'false'} && !session) { return res.status(401).json({ error: 'Unauthorized' }); }\n    next();\n  } catch (e) { res.status(500).json({ error: 'Auth failure' }); }\n});`);
    authLines.push(`// expose requireRole if provided\nconst requireRole = authAdapter.requireRole || ((role: string)=> (req:any,res:any,next:any)=> next());`);
  }

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
// TODO: attach multipart handlers for upload policies (generated in uploads/*)
// Basic health/readiness endpoints
app.get('/healthz', (req, res) => { res.json({ ok: true, uptime: process.uptime(), ts: Date.now() }) })
let startedAt = Date.now();
app.get('/readyz', (req, res) => { res.json({ ready: true, uptime: process.uptime(), startedAt }) })
${authLines.join('\n')}
${guardLines.join('\n')}
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
