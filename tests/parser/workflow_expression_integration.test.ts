import { parseLocus } from '../../src/parser';

describe('workflow expression integration', () => {
  test('captures simple run arg expression', () => {
  const src = `workflow W { trigger { on:create(A) } steps { run doThing(order.id) } }`;
    const ast: any = parseLocus(src);
    const step = ast.workflows[0].steps[0];
  expect(step.run).toBeDefined();
  expect(step.run.action).toBe('doThing');
  expect(step.run.argsRaw).toBe('order.id');
  // expr may be parsed into member expression
  if (step.run.expr) expect(step.run.expr.kind).toBe('member');
  });
});
