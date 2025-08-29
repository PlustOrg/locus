import { PluginManager } from '../../src/plugins/manager';

describe('plugin slow hook warning', () => {
  test('warns when hook exceeds 50ms', async () => {
    const pm = new PluginManager(process.cwd(), { } as any);
    (pm as any).plugins = [{ name: 'slow', onWorkflowParse: async () => { await new Promise(r=>setTimeout(r,55)); } }];
    const wf: any = { name: 'A' };
    await pm.onWorkflowParse(wf);
    expect(pm.warnings.find(w=>/slow onWorkflowParse/i.test(w))).toBeTruthy();
  });
});
