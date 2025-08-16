import { readFileSync } from 'fs';
import path from 'path';
import { parseToml } from '../config/toml';
import { buildProject } from './build';

export async function deploy(opts: { cwd: string; env: string }) {
  const file = path.join(opts.cwd, 'Locus.toml');
  const src = readFileSync(file, 'utf8');
  const toml = parseToml(src);
  // run build first
  await buildProject({ srcDir: opts.cwd, outDir: path.join(opts.cwd, 'generated') });
  // In a full implementation, we would integrate with providers. For now, surface what we'd do.
  const section = (toml._sections || {})[`deploy.${opts.env}`] || {};
  const app = (toml._sections || {}).app || {};
  return {
    appName: app.name || path.basename(opts.cwd),
    frontend: section.platform || 'vercel',
    backend: section.backend_platform || section.platform || 'railway',
    databaseUrl: section.database_url || process.env.DATABASE_URL,
  };
}
