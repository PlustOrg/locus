import { existsSync, readFileSync, writeFileSync } from 'fs';
import vm from 'vm';
import { join } from 'path';
import { LocusPlugin } from './types';
import { LocusConfig } from '../config/config';

export class PluginManager {
  plugins: LocusPlugin[] = [];
  warnings: string[] = [];
  virtualAsts: any[] = [];
  extraArtifacts: Record<string,string> = {};
  registeredGenerators: Array<{ plugin: string; name: string; fn: (u:any)=>Record<string,string> }> = [];
  workflowStepKinds: Record<string, { run?(step:any, execCtx:any): any; plugin: string }> = {};
  timings: Record<string, Record<string, number>> = {};
  capabilityRegistry = { tokens: new Set<string>(), workflowSteps: new Map<string, { schema?: Record<string, any> }>(), validations: [] as Array<{ id: string; run(ast:any): void|Promise<void> }> };
  constructor(public srcDir: string, private config?: LocusConfig) {}
  private perfCachePath = join(process.cwd(), '.locus_plugin_perf.json');
  private perfCache: Record<string, any> = {};

  private static moduleCache: Record<string, any> = {};

  async load() {
  // load perf cache if present
  try { if (existsSync(this.perfCachePath)) this.perfCache = JSON.parse(readFileSync(this.perfCachePath,'utf8')); } catch {}
    const configPath = join(this.srcDir, 'locus.plugins.js');
    if (!existsSync(configPath)) return;
    try {
      const mod: any = await import(configPath);
      const loaded = mod && mod.default ? mod.default : mod;
      let entries: any[] = [];
      if (Array.isArray(loaded)) entries = loaded as any[]; else if (loaded && typeof loaded === 'object') entries = [loaded];
      // resolve string module specifiers
      const resolved: LocusPlugin[] = [];
      const isolate = !!(process.env.LOCUS_PLUGIN_ISOLATE === '1' || (this.config as any)?.security?.isolatePlugins);
      const allowedModules = new Set((process.env.LOCUS_PLUGIN_ALLOW || '').split(',').filter(Boolean));
      for (const entry of entries) {
        if (typeof entry === 'string') {
          try {
            const key = require.resolve(entry, { paths: [this.srcDir] });
            if (PluginManager.moduleCache[key]) { resolved.push(PluginManager.moduleCache[key]); continue; }
            let plug: any;
            if (isolate) {
              const code = readFileSync(key, 'utf8');
              const sandbox: any = { module: { exports: {} }, exports: {}, process: { env: {} } };
              sandbox.require = (mod: string) => {
                if (!allowedModules.has(mod)) throw new Error(`module '${mod}' blocked in isolated mode`);
                // Use dynamic import to satisfy lint restrictions
                return import(mod);
              };
              vm.createContext(sandbox);
              try { new vm.Script(code, { filename: key }).runInContext(sandbox, { timeout: 1000 }); } catch (e:any) { this.warnings.push(`[plugin-loader][isolate] ${entry} error: ${e.message}`); continue; }
              plug = sandbox.module.exports?.default || sandbox.module.exports || sandbox.exports;
            } else {
              const m = await import(key);
              plug = (m && m.default) ? m.default : m;
            }
            if (plug && typeof plug === 'object') { PluginManager.moduleCache[key] = plug; resolved.push(plug); }
          } catch (e: any) {
            this.warnings.push(`[plugin-loader] failed to resolve '${entry}': ${e.message || e}`);
          }
        } else if (entry && typeof entry === 'object') {
          resolved.push(entry as LocusPlugin);
        }
      }
      this.plugins = resolved;
  // write perf cache stub (currently only plugin list + timestamp)
  try { writeFileSync(this.perfCachePath, JSON.stringify({ ts: Date.now(), plugins: this.plugins.map(p=>p.name) }, null, 2)); } catch {}
      // manifest validation
      for (const p of this.plugins) {
        const name = p.name || 'anonymous';
        (this.timings[name] ||= {});
        const apiV = (p as any).apiVersion;
        const SUPPORTED = 1;
        if (apiV == null) {
          (p as any).apiVersion = SUPPORTED;
        } else if (apiV !== SUPPORTED) {
          this.warnings.push(`[plugin ${name}] unsupported apiVersion ${apiV} (expected ${SUPPORTED})`);
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
    const timeoutMs = this.config?.performance?.pluginTimeoutMs || Number(process.env.LOCUS_PLUGIN_TIMEOUT_MS || '0');
  const memLimitKb = Number(process.env.LOCUS_PLUGIN_HOOK_MEM_KB || '0');
  for (const p of this.plugins) {
      const fn = p[hook];
      if (typeof fn === 'function') {
        const name = p.name || 'anon';
        const start = Date.now();
    const memBefore = process.memoryUsage().heapUsed;
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
          const memAfter = process.memoryUsage().heapUsed;
          const memDeltaKb = (memAfter - memBefore)/1024;
          (this.timings[name] ||= {})[String(hook)] = dur;
          if (dur > 50) this.warnings.push(`[plugin ${name}] slow ${String(hook)} ${dur}ms >50ms`);
          if (memLimitKb > 0 && memDeltaKb > memLimitKb) this.warnings.push(`[plugin ${name}] memory growth ${memDeltaKb.toFixed(1)}KB in hook ${String(hook)} > ${memLimitKb}KB`);
        }
      }
    }
  }

  async onParseStart(file: string, src: string) { await this.run('onParseStart', file, src); }
  async onFileParsed(file: string, ast: any) { await this.run('onFileParsed', file, ast); }
  async onParseComplete(asts: any[]) { await this.run('onParseComplete', asts); }
  async onWorkflowParse(workflow: any) { await this.run('onWorkflowParse', workflow); }
  async onWorkflowValidate(workflow: any) { await this.run('onWorkflowValidate', workflow); }
  async onValidate(unified: any) { await this.run('onValidate', unified); }
  async onBeforeGenerate(unified: any) { await this.run('onBeforeGenerate', unified); }
  async onAfterGenerate(result: { artifacts: Record<string,string>; meta: any }) { await this.run('onAfterGenerate', result); }
  async runCapabilityValidations(ast: any) {
    for (const v of this.capabilityRegistry.validations) {
      try { await v.run(ast); } catch (e:any) { this.warnings.push(`[capability validation ${v.id}] ${e.message}`); }
    }
  }

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
  const perfWarnMs = this.config?.performance?.pluginHookWarnMs || Number(process.env.LOCUS_PLUGIN_HOOK_WARN_MS || '0');
    if (perfWarnMs > 0) {
      for (const [pName, hooks] of Object.entries(this.timings)) {
        for (const [hName, ms] of Object.entries(hooks)) {
          if (ms > perfWarnMs) this.warnings.push(`[plugin ${pName}] performance: hook ${hName} ${ms}ms > ${perfWarnMs}ms`);
        }
      }
    }
  }

  collectWorkflowStepKinds() {
    for (const p of this.plugins) {
      const reg = p.registerWorkflowStepKinds?.();
      if (!reg) continue;
      const plugin = p.name || 'anonymous';
      for (const ent of reg) {
        if (!ent.kind) continue;
        if (this.workflowStepKinds[ent.kind]) { this.warnings.push(`[plugin ${plugin}] step kind '${ent.kind}' already registered; keeping first`); continue; }
        this.workflowStepKinds[ent.kind] = { run: ent.run, plugin };
      }
    }
    // collect capabilities declared directly
    for (const p of this.plugins) {
      const caps: any = (p as any).capabilities;
      if (!caps) continue;
      for (const t of caps.tokens || []) this.capabilityRegistry.tokens.add(t);
      for (const s of caps.workflowSteps || []) if (!this.capabilityRegistry.workflowSteps.has(s.kind)) this.capabilityRegistry.workflowSteps.set(s.kind, { schema: s.schema });
      for (const v of caps.validations || []) this.capabilityRegistry.validations.push(v);
    }
  }
}

export async function initPluginManager(srcDir: string, config?: LocusConfig): Promise<PluginManager> {
  const pm = new PluginManager(srcDir, config);
  await pm.load();
  return pm;
}
