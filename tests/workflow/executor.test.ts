import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { executeWorkflow } from '../../src/workflow/runtime';

const src = `workflow W {
  trigger { on:create(A) }
  steps {
    const x = run add(val: one)
    run add(val: two)
  branch { condition: { 1 > 0 } steps { run add(val: four) } else { run add(val: five) } }
    forEach item in items { run add(val: item) }
  }
}`;

describe('workflow runtime executor', () => {
  test('executes run, branch, for_each', () => {
  const ast: any = parseLocus(src, 'exec.locus');
    const unified = mergeAsts([ast]);
    const wf = unified.workflows[0];
    const log = executeWorkflow(wf, { inputs: { items: [10,20] }, actions: { add: (...args:any[]) => args.reduce((a:number,b:number)=>a+b,0) } });
    const kinds = log.map(l=>l.kind);
  // top-level: const x run, run add(val: two), branch then run (3), forEach body run twice (5 total)
  expect(kinds.filter(k=>k==='run').length).toBe(5);
  expect(kinds.includes('branch')).toBe(true);
  expect(kinds.includes('for_each')).toBe(true);
  });
});
