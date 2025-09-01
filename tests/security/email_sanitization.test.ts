import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAstWithPlugins } from '../../src/validator/validate';

async function validate(src: string) {
  const ast = parseLocus(src, 'file.locus');
  const merged = mergeAsts([ast] as any);
  const pluginMgr: any = {
    warnings: [],
    virtualAsts: [],
    onParseComplete: async () => {},
    onValidate: async () => {},
    collectWorkflowStepKinds: () => {},
    onWorkflowParse: async () => {},
    onWorkflowValidate: async () => {}
  };
  await validateUnifiedAstWithPlugins(merged as any, pluginMgr);
  return merged;
}

describe('send_email sanitization', () => {
  test('rejects newline in subject', async () => {
  const src = `workflow W { trigger { t } steps { send_email { to: "user@example.com" subject: "Hello\nWorld" } } }`;
    await expect(validate(src)).rejects.toThrow(/subject contains newline/);
  });
  test('rejects absolute template path', async () => {
  const src = `workflow W { trigger { t } steps { send_email { to: "user@example.com" template: "/etc/passwd" } } }`;
    await expect(validate(src)).rejects.toThrow(/must be relative/);
  });
});
