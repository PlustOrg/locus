import { executeWorkflow } from '../../src/workflow/runtime';

describe('workflow resource limits', () => {
  test('stops executing when max step limit exceeded', () => {
    const steps: any[] = [];
    for (let i=0;i<15;i++) steps.push({ kind: 'run', raw: 'run doThing', action: 'doThing' });
    const block: any = { steps };
    const actions: any = { doThing: jest.fn(() => 1) };
    process.env.LOCUS_MAX_WORKFLOW_STEPS = '10';
    const log = executeWorkflow(block, { actions });
    const limitEntry = log.find(l => l.kind === 'limit_exceeded');
    expect(limitEntry).toBeTruthy();
    expect(actions.doThing).toHaveBeenCalledTimes(10); // stopped exactly at limit
  });
});
