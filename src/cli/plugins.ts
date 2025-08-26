import { initPluginManager } from '../plugins/manager';

/**
 * List all plugins in the project, returning their names.
 */
export async function listPlugins(srcDir: string): Promise<string[]> {
  const pluginManager = await initPluginManager(srcDir);
  return pluginManager.plugins.map(p => p.name || 'anonymous');
}

/**
 * Run plugin diagnostics and return plugin info, warnings, timings, and hook summary.
 */
export async function doctorPlugins(srcDir: string): Promise<{
  plugins: { name?: string }[];
  warnings: string[];
  timings: any;
  hookSummary: any[];
}> {
  const pluginManager = await initPluginManager(srcDir);
  try { await pluginManager.onParseComplete([]); } catch {/* ignore */}
  const dummyUnified: any = { database: { entities: [] } };
  try { await pluginManager.onBeforeGenerate(dummyUnified); } catch {/* ignore */}
  try { await pluginManager.onAfterGenerate({ artifacts: {}, meta: {} }); } catch {/* ignore */}
  const hookSummary = pluginManager.plugins.map(p => ({ name: p.name, hooks: Object.keys(p).filter(k => k.startsWith('on')) }));
  return {
    plugins: pluginManager.plugins.map(p => ({ name: p.name })),
    warnings: pluginManager.warnings,
    timings: pluginManager.timings,
    hookSummary
  };
}
