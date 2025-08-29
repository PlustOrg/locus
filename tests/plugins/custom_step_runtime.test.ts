import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { initPluginManager } from '../../src/plugins/manager';
import { executeWorkflow } from '../../src/workflow/runtime';
import Module from 'module';

// Define an in-memory plugin via module cache monkey patching approach.
// We'll simulate a plugin exported from a temp path by injecting into require cache.

describe('plugin custom workflow step execution', () => {
  test('registered custom step kind executes via runtime', async () => {
    const pluginPath = require.resolve('../../package.json'); // stable existing file path for key
    const fakePlugin: any = {
      name: 'custom-step-plugin',
      registerWorkflowStepKinds() {
        return {
          custom_task: {
            run(step: any, _api: any) {
              return 'done-'+(step.raw || '').length;
            }
          }
        };
      }
    };
    const originalLoad = (Module as any)._load;
    (Module as any)._load = function(request: string, _parent: any, _isMain: boolean, ...rest: any[]) {
      if (request === pluginPath) return fakePlugin; // not perfect but suffices for injection
      return originalLoad.call(this, request, _parent, _isMain, ...rest);
    };
    try {
      const pm = await initPluginManager(process.cwd(), { plugins: [pluginPath] } as any);
  const src = `workflow P { trigger { t } steps { } }`;
      const ast: any = parseLocus(src, 'p.locus');
      const unified = mergeAsts([ast]);
  await pm.onWorkflowParse(unified.workflows || []);
  // Inject a synthetic custom step as plugin might during parse hook
  const wf = unified.workflows[0];
  (wf as any).steps = [ { kind: 'custom_task', raw: 'custom_task { inner stuff }' } ];
      const log = executeWorkflow(wf, { pluginManager: pm });
      const kinds = log.map(e=>e.kind);
      expect(kinds).toContain('custom_task');
  // custom_task runtime log produced by runtime integration path
  expect(kinds).toContain('custom_task');
    } finally {
      (Module as any)._load = originalLoad;
    }
  });
});
