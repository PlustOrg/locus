import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { executeWorkflow } from '../../src/workflow/runtime';

describe('workflow runtime retry', () => {
  test('retries failing run step then succeeds', () => {
    const src = `workflow R { trigger { t } retry { max: 2, backoff: fixed } steps { run flaky() } }`;
    const ast: any = parseLocus(src, 'r.locus');
    const unified = mergeAsts([ast]);
    let calls = 0;
    const log = executeWorkflow(unified.workflows[0], { actions: { flaky: () => { calls++; if (calls < 3) throw new Error('fail'); return 'ok'; } } });
    expect(calls).toBe(3);
    const kinds = log.map(l=>l.kind);
    expect(kinds.filter(k=>k==='retry_wait').length).toBe(2);
    expect(kinds.includes('retry_success')).toBe(true);
  });
  test('exhausts retries', () => {
    const src = `workflow R2 { trigger { t } retry { max: 1, backoff: exponential, factor: 3 } steps { run boom() } }`;
    const ast: any = parseLocus(src, 'r2.locus');
    const unified = mergeAsts([ast]);
    let calls = 0;
    const log = executeWorkflow(unified.workflows[0], { actions: { boom: () => { calls++; throw new Error('nope'); } } });
    const retryEx = log.find(e=>e.kind==='retry_exhausted');
    expect(retryEx).toBeTruthy();
    expect(calls).toBe(2);
  });
});
