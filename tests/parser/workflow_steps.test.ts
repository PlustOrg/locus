import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

const src = `workflow Demo {\n  trigger { on:create(Order) }\n  steps {\n    const items = run fetchItems(orderId: orderId)\n    run process(orderId: orderId)\n    delay { for: "5 minutes" }\n    forEach it in items { run handle(item: it) }\n    branch { condition: { items > 0 } steps { run finalize() } else { run noop() } }\n  }\n}`;

describe('workflow structured steps', () => {
  test('steps captured structurally', () => {
    const ast = parseLocus(src, 'demo.locus');
    const unified = mergeAsts([ast]);
    const wf = unified.workflows[0];
    expect(wf.steps).toBeTruthy();
    expect(Array.isArray(wf.steps)).toBe(true);
  const stepsArr = wf.steps as any;
  expect(Array.isArray(stepsArr)).toBe(true);
  expect(stepsArr.length).toBeGreaterThan(3);
  });
});
