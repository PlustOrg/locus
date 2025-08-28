import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { runPipeline } from '../../src/generator/pipeline';

describe('workflow manifest generation', () => {
  test('emits manifest json', () => {
    const src = `workflow W { trigger { on:create(Order) } steps { run a() run b(x: 1) } }`;
    const ast = parseLocus(src, 'w.locus');
    const unified = mergeAsts([ast]);
    const { files } = runPipeline(unified, {});
    const manifest = files['workflows/W.json'];
    expect(manifest).toBeTruthy();
    const parsed = JSON.parse(manifest!);
    expect(parsed.name).toBe('W');
    expect(parsed.steps.length).toBe(2);
  });
});
