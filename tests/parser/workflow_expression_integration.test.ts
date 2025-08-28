import { parseLocus } from '../../src/parser';

describe('workflow expression integration', () => {
  test('captures simple run arg expression', () => {
  const src = `workflow W { trigger { on:create(A) } steps { run doThing(order.id) } }`;
    const ast: any = parseLocus(src);
    const step = ast.workflows[0].steps[0];
  expect(step.kind).toBe('run');
  expect(step.action).toBe('doThing');
  expect(step.argsRaw).toBe('order.id');
  });
});
