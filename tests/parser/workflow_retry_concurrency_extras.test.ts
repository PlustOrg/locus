import { parseLocus } from '../../src/parser';

test('workflow concurrency & retry extras', () => {
  const src = `workflow W { concurrency { limit: 5, group: shardA } retry { max: -3, factor: -2, delay: 5s custom: 10 } steps { run doThing() } }`;
  const ast: any = parseLocus(src, 'w.locus');
  const wf = ast.workflows.find((w:any)=>w.name==='W');
  expect(wf.concurrency.limit).toBe(5);
  expect(wf.concurrency.group).toBe('shardA');
  expect(wf.retry.max).toBe(-3);
  expect(wf.retry.factor).toBe(-2);
  expect(wf.retry.delayMs).toBe(5000); // 5s
  expect(wf.retry._unknown || wf.retry._unknownEntries).toBeTruthy();
});
