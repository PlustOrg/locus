import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { executeWorkflow, globalConcurrency } from '../../src/workflow/runtime';

describe('workflow runtime concurrency', () => {
  test('drops when over limit', () => {
  const src = `workflow A { trigger { t } concurrency { group: G limit: 1 } steps { run act() } }`;
    const ast: any = parseLocus(src, 'a.locus');
    const unified = mergeAsts([ast]);
    const wf = unified.workflows[0];
  // Manually simulate an in-progress execution by poking runtime global (discouraged in prod, OK for test)
  globalConcurrency['G'] = { limit: 1, active: 1 } as any;
  const logs2 = executeWorkflow(wf, { actions: { act: ()=>'x' } });
    expect(logs2.find(e=>e.kind==='concurrency_dropped')).toBeTruthy();
  });
});
