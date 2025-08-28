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
  test('includes retry config when present', () => {
    const src = `workflow R { trigger { t } retry { max: 5, backoff: fixed } steps { run act() } }`;
    const ast = parseLocus(src, 'r.locus');
    const unified = mergeAsts([ast]);
    const { files } = runPipeline(unified, {});
    const parsed = JSON.parse(files['workflows/R.json']);
    expect(parsed.retry).toContain('max: 5');
    expect(parsed.retryConfig.max).toBe('5');
    expect(Object.keys(parsed.retryConfig).sort()).toEqual(['backoff','max']);
  });
});
