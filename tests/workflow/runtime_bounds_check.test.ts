import { executeWorkflow } from '../../src/workflow/runtime';

describe('workflow runtime bounds checking', () => {
  test('for_each over non-array logs bounds_warning', () => {
    const wf: any = { steps: [ { kind: 'for_each', loopVar: 'x', iterRaw: 'items', steps: [ { kind: 'run', action: 'act', args: [] } ] } ] };
    const log = executeWorkflow(wf, { actions: { act: ()=>1 }, inputs: { items: 42 } });
    const kinds = log.map(l=>l.kind);
    expect(kinds.includes('bounds_warning')).toBe(true);
  });
});
