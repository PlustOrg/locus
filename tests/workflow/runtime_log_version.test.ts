import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { executeWorkflow } from '../../src/workflow/runtime';

test('execution log entries include version', () => {
  const src = `workflow V { trigger { t } steps { run act() } }`;
  const ast: any = parseLocus(src,'v.locus');
  const unified = mergeAsts([ast]);
  const log = executeWorkflow(unified.workflows[0], { actions: { act: ()=>42 } });
  expect(log.find(e=>e.kind==='run')!.v).toBe(1);
});
