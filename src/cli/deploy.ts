
import { readFileSync } from 'fs';
import path from 'path';
import { parseToml } from '../config/toml';
import { buildProject } from './build';

/**
 * Deploy command for Locus CLI.
 * Runs a production build and surfaces deployment configuration for the given environment.
 */
export async function deploy(opts: { cwd: string; env: string }) {
  // Read and parse Locus.toml config
  const locusTomlPath = path.join(opts.cwd, 'Locus.toml');
  const tomlSource = readFileSync(locusTomlPath, 'utf8');
  const toml = parseToml(tomlSource);

  // Run production build first
  await buildProject({ srcDir: opts.cwd, outDir: path.join(opts.cwd, 'generated') });

  // Extract deployment section for the specified environment
  const deploySection = (toml._sections || {})[`deploy.${opts.env}`] || {};
  const appSection = (toml._sections || {}).app || {};

  // Return deployment info (surface only; no actual deploy)
  return {
    appName: appSection.name || path.basename(opts.cwd),
    frontend: deploySection.platform || 'vercel',
    backend: deploySection.backend_platform || deploySection.platform || 'railway',
    databaseUrl: deploySection.database_url || process.env.DATABASE_URL,
  };
}
