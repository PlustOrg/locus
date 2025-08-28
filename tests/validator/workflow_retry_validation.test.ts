import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateProject } from '../../src/validator/validate';

describe('workflow retry validation', () => {
  function validate(src: string) {
    const ast = parseLocus(src, 'wf.locus');
    const unified = mergeAsts([ast]);
    validateProject(unified); // throws on error
    return unified.workflows[0];
  }
  test('accepts minimal retry config', () => {
    const wf = validate(`workflow R { trigger { x } retry { max: 3, backoff: fixed } steps { run act() } }`);
    expect((wf as any).retryConfig.max).toBe('3');
  });
  test('rejects invalid max', () => {
    const src = `workflow R { trigger { x } retry { max: -1, backoff: exponential } steps { run act() } }`;
    expect(() => validate(src)).toThrow(/retry.max/);
  });
  test('rejects unknown key', () => {
    const src = `workflow R { trigger { x } retry { foo: 2 } steps { run act() } }`;
    expect(() => validate(src)).toThrow(/retry.foo/);
  });
});
