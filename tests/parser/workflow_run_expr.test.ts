import { parseLocus } from '../../src/parser';

const src = `workflow W { trigger { on:create(A) } steps { run doThing(order.id) run other(noArg: value) } }`;

describe('workflow run step expression capture', () => {
  test('captures single arg member expression', () => {
    const ast: any = parseLocus(src);
    const wf = ast.workflows[0];
    const first = wf.steps[0];
    expect(first.run).toBeDefined();
    expect(first.run.action).toBe('doThing');
    expect(first.run.expr || first.run.expr).toBeDefined();
    expect(first.run.expr.kind === 'member' || first.run.argsRaw === 'order.id').toBe(true);
  });
});
