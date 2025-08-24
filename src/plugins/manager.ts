import { existsSync } from 'fs';
import { join } from 'path';
import { LocusPlugin } from './types';

export class PluginManager {
  plugins: LocusPlugin[] = [];
  warnings: string[] = [];
  virtualAsts: any[] = [];
  extraArtifacts: Record<string,string> = {};
  registeredGenerators: Array<{ plugin: string; name: string; fn: (u:any)=>Record<string,string> }> = [];
  timings: Record<string, Record<string, number>> = {};
  constructor(public srcDir: string) {}

  private static moduleCache: Record<string, any> = {};

  async load() {
    const configPath = join(this.srcDir, 'locus.plugins.js');
    if (!existsSync(configPath)) return;
    try {
      const mod: any = await import(configPath);
      const loaded = mod && mod.default ? mod.default : mod;
      let entries: any[] = [];
      if (Array.isArray(loaded)) entries = loaded as any[]; else if (loaded && typeof loaded === 'object') entries = [loaded];
      // resolve string module specifiers
      const resolved: LocusPlugin[] = [];
      for (const entry of entries) {
        if (typeof entry === 'string') {
          try {
            const key = require.resolve(entry, { paths: [this.srcDir] });
            if (PluginManager.moduleCache[key]) { resolved.push(PluginManager.moduleCache[key]); continue; }
            const m = await import(key);
            const plug = (m && m.default) ? m.default : m;
            if (plug && typeof plug === 'object') { PluginManager.moduleCache[key] = plug; resolved.push(plug); }
          } catch (e: any) {
            this.warnings.push(`[plugin-loader] failed to resolve '${entry}': ${e.message || e}`);
          }
        } else if (entry && typeof entry === 'object') {
          resolved.push(entry as LocusPlugin);
        }
      }
      this.plugins = resolved;
      // manifest validation
      for (const p of this.plugins) {
        const name = p.name || 'anonymous';
        (this.timings[name] ||= {});
        const apiV = (p as any).apiVersion;
        if (apiV != null && apiV !== 1) {
          this.warnings.push(`[plugin ${name}] unsupported apiVersion ${apiV} (expected 1)`);
        }
      }
    } catch (e: any) {
      this.warnings.push('Failed to load plugins: ' + (e?.message || e));
    }
  }

  private ctx(pluginName?: string) {
    return {
      addWarning: (m: string) => this.warnings.push(m),
      addVirtualAst: (a: any) => { if (a) this.virtualAsts.push(a); },
      writeArtifact: (p: string, c: string) => { this.extraArtifacts[p] = c; },
      registerGenerator: (name: string, fn: (u:any)=>Record<string,string>) => {
        this.registeredGenerators.push({ plugin: pluginName || 'anonymous', name, fn });
      }
    };
  }

  private async run<K extends keyof LocusPlugin>(hook: K, ...args: any[]) {
    const timeoutMs = Number(process.env.LOCUS_PLUGIN_TIMEOUT_MS || '0');
    for (const p of this.plugins) {
      const fn = p[hook];
      if (typeof fn === 'function') {
        const name = p.name || 'anon';
        const start = Date.now();
        const exec = (async () => (fn as any)(...args, this.ctx(name)))();
        let timedOut = false;
  let _res;
        try {
          if (timeoutMs > 0) {
            _res = await Promise.race([
              exec,
              new Promise((_, reject) => setTimeout(() => { timedOut = true; reject(new Error('hook timeout')); }, timeoutMs))
            ]);
          } else {
            _res = await exec;
          }
        } catch (e: any) {
          if (timedOut) this.warnings.push(`[plugin ${name} ${String(hook)} timeout >${timeoutMs}ms]`);
          else this.warnings.push(`[plugin ${name} ${String(hook)} error] ${e.message || e}`);
        } finally {
          const dur = Date.now() - start;
          (this.timings[name] ||= {})[String(hook)] = dur;
        }
      }
    }
  }

  async onParseStart(file: string, src: string) { await this.run('onParseStart', file, src); }
  async onFileParsed(file: string, ast: any) { await this.run('onFileParsed', file, ast); }
  async onParseComplete(asts: any[]) { await this.run('onParseComplete', asts); }
  async onValidate(unified: any) { await this.run('onValidate', unified); }
  async onBeforeGenerate(unified: any) { await this.run('onBeforeGenerate', unified); }
  async onAfterGenerate(result: { artifacts: Record<string,string>; meta: any }) { await this.run('onAfterGenerate', result); }

  runCustomGenerators(unified: any) {
    for (const g of this.registeredGenerators) {
      try {
        const artifacts = g.fn(unified) || {};
        for (const [rel, content] of Object.entries(artifacts)) {
          if (this.extraArtifacts[rel]) {
            this.warnings.push(`[plugin ${g.plugin}] artifact conflict for ${rel} (keeping first)`);
            continue;
          }
            this.extraArtifacts[rel] = content as string;
        }
      } catch (e: any) {
        this.warnings.push(`[plugin ${g.plugin}] generator '${g.name}' error: ${e.message || e}`);
      }
    }
    // performance threshold warnings
    const perfWarnMs = Number(process.env.LOCUS_PLUGIN_HOOK_WARN_MS || '0');
    if (perfWarnMs > 0) {
      for (const [pName, hooks] of Object.entries(this.timings)) {
        for (const [hName, ms] of Object.entries(hooks)) {
          if (ms > perfWarnMs) this.warnings.push(`[plugin ${pName}] performance: hook ${hName} ${ms}ms > ${perfWarnMs}ms`);
        }
      }
    }
  }
}

export async function initPluginManager(srcDir: string): Promise<PluginManager> {
  const pm = new PluginManager(srcDir);
  await pm.load();
  return pm;
}
