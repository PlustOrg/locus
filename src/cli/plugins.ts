import { initPluginManager } from '../plugins/manager';

export async function listPlugins(srcDir: string): Promise<string[]> {
  const pm = await initPluginManager(srcDir);
  return pm.plugins.map(p => p.name || 'anonymous');
}

export async function doctorPlugins(srcDir: string): Promise<{ plugins: { name?: string }[]; warnings: string[]; timings: any; hookSummary: any[] }> {
  const pm = await initPluginManager(srcDir);
  try { await pm.onParseComplete([]); } catch {/* ignore */}
  const dummyUnified: any = { database: { entities: [] } };
  try { await pm.onBeforeGenerate(dummyUnified); } catch {/* ignore */}
  try { await pm.onAfterGenerate({ artifacts: {}, meta: {} }); } catch {/* ignore */}
  const hookSummary = pm.plugins.map(p => ({ name: p.name, hooks: Object.keys(p).filter(k=>k.startsWith('on')) }));
  return { plugins: pm.plugins.map(p => ({ name: p.name })), warnings: pm.warnings, timings: pm.timings, hookSummary };
}
