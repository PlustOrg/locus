import { parseLocus } from '../../src/parser';

describe('workflow parser scaffold', () => {
  test('minimal workflow with trigger and steps', () => {
    const src = `workflow Example {\n  trigger { on:create(Order) }\n  steps { run doSomething() }\n}`;
    const ast = parseLocus(src, 'workflow_basic.locus');
    expect(ast).toBeTruthy();
  // Phase 1: ensure workflows array exists and contains name
  expect((ast as any).workflows).toBeTruthy();
  expect((ast as any).workflows[0].name).toBe('Example');
  });
});
