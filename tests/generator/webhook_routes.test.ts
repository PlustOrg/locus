import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { buildOutputArtifacts } from '../../src/generator/outputs';

describe('webhook route generation', () => {
  test('generates webhooks.stub.ts with secret check', () => {
    const src = `workflow Hooker { trigger { on:webhook(secret: HOOK_SECRET) } steps { delay { } } }`;
    const ast: any = parseLocus(src, 'hook.locus');
    const unified = mergeAsts([ast]);
    const { files } = buildOutputArtifacts(unified as any, { srcDir: process.cwd(), includeNext: false, includeTheme: false });
    const stub = files['webhooks.stub.ts'];
    expect(stub).toBeTruthy();
    expect(stub).toMatch(/Hooker/);
    expect(stub).toMatch(/HOOK_SECRET/);
  });
});
