import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

describe('workflow retry block parsing', () => {
  test('captures retry raw content', () => {
    const src = `workflow R { trigger { on:create(A) } retry { max: 5, backoff: exponential } steps { run doThing() } }`;
    const ast: any = parseLocus(src, 'r.locus');
    const unified = mergeAsts([ast]);
    const wf = unified.workflows[0];
  expect(wf.retry).toBeTruthy();
  expect(((wf.retry as any)?.raw)).toContain('max: 5');
  });
});
