import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { createContext, builtinSteps } from '../../src/generator/pipeline';

const src = `workflow Demo { trigger { on:create(Order) } steps { run doThing(order.id) delay { for: "1m" } } }`;

describe('workflow manifest structured steps', () => {
  test('includes kind and action', () => {
    const ast = parseLocus(src, 'demo.locus');
    const unified = mergeAsts([ast]);
    const ctx = createContext(unified, {});
    const step = builtinSteps.find(s=>s.name==='workflows-manifest');
    step!.run(ctx as any);
    const json = ctx.files['workflows/Demo.json'];
    expect(json).toBeDefined();
    const parsed = JSON.parse(json!);
    expect(parsed.steps[0].kind).toBe('run');
    expect(parsed.steps[0].action).toBe('doThing');
    expect(parsed.steps[1].kind).toBe('delay');
  });
});
