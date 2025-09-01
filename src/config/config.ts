// Bypass jest mock by resolving real fs via createRequire
import { createRequire } from 'module';
// createRequire requires a filename; __filename works in CJS; fallback to process.cwd()
const realFs: typeof import('fs') = createRequire(__filename || process.cwd())('fs');
import path from 'path';
import { parseToml } from './toml';

export interface AuthConfig { jwtSecret?: string }
export interface PerformanceThresholds { pluginHookWarnMs?: number; pluginTimeoutMs?: number }
export interface LocusConfig {
  auth?: AuthConfig;
  deploy?: Record<string, any>;
  performance?: PerformanceThresholds;
  flags?: Record<string, any>;
  suppressDeprecated?: boolean;
  raw: any; // original parsed toml
}

export function loadConfig(srcDir: string): LocusConfig {
  const file = path.join(srcDir, 'Locus.toml');
  let raw: any = {};
  const exists = typeof (realFs as any).existsSync === 'function' ? (realFs as any).existsSync(file) : false;
  if (exists) {
  const text = (realFs as any).readFileSync(file, 'utf8');
    raw = parseToml(text);
  }
  const cfg: LocusConfig = { raw };
  if (raw._sections?.auth) cfg.auth = { jwtSecret: raw._sections.auth.jwtSecret };
  if (raw._sections?.performance) {
    cfg.performance = {
      pluginHookWarnMs: numberOrUndefined(envOr(raw._sections.performance.pluginHookWarnMs, 'LOCUS_PLUGIN_HOOK_WARN_MS')),
      pluginTimeoutMs: numberOrUndefined(envOr(raw._sections.performance.pluginTimeoutMs, 'LOCUS_PLUGIN_TIMEOUT_MS')),
    };
  }
  // simple deprecated key detection
  const deprecated: string[] = [];
  if ((raw as any).auth) deprecated.push('top-level auth (use [auth] section)');
  if (deprecated.length) {
    (cfg as any).warnings = deprecated.map(d => `Deprecated config: ${d}`);
  }
  if (raw._sections?.deprecations) {
    if (raw._sections.deprecations.suppressDeprecated === true) cfg.suppressDeprecated = true;
  }
  return cfg;
}

function envOr(val: any, envKey: string): any {
  if (process.env[envKey] != null) return process.env[envKey];
  return val;
}
function numberOrUndefined(v: any): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
