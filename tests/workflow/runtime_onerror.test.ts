import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { executeWorkflow } from '../../src/workflow/runtime';

describe('workflow runtime onError', () => {
  test('executes onError runs after failure', () => {
  const src = `workflow W { trigger { t } on_error { recover_action } steps { run boom() } }`;
    const ast: any = parseLocus(src, 'w.locus');
    const unified = mergeAsts([ast]);
    const wf = unified.workflows[0];
    const log = executeWorkflow(wf, { actions: { boom: () => { throw new Error('fail'); }, recover: () => 'ok' } });
    const kinds = log.map(l=>l.kind);
    expect(kinds[0]).toBe('error');
    expect(log.filter(e=>e.detail?.onError).length).toBe(1);
  });
});
