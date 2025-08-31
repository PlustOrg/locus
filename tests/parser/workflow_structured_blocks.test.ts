import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

test('structured trigger events parsed', () => {
  const src = `workflow MyFlow { trigger { on create(User) on update(User) } steps { delay { } } }`;
  const ast = parseLocus(src, 'mem.locus');
  const unified = mergeAsts([ast]);
  const wf = unified.workflows![0] as any;
  expect(wf.trigger.events.length).toBe(2);
  validateUnifiedAst(unified);
});

test('webhook trigger requires secret', () => {
  const src = `workflow WebhookFlow { trigger { on webhook() } steps { delay { } } }`;
  const ast = parseLocus(src, 'mem.locus');
  const unified = mergeAsts([ast]);
  expect(() => validateUnifiedAst(unified)).toThrow(/missing secret/);
});

test('retry structured validation', () => {
  const src = `workflow RetryFlow { trigger { on create(Item) } retry { max: 3 backoff: exponential factor: 2 delay: 5s } steps { delay { } } }`;
  const ast = parseLocus(src, 'mem.locus');
  const unified = mergeAsts([ast]);
  validateUnifiedAst(unified);
});

test('invalid concurrency limit', () => {
  const src = `workflow BadConc { trigger { on create(A) } concurrency { limit: 0 } steps { delay { } } }`;
  const ast = parseLocus(src, 'mem.locus');
  const unified = mergeAsts([ast]);
  expect(() => validateUnifiedAst(unified)).toThrow(/concurrency.limit/);
});
