import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

describe('webhook trigger invalid combo', () => {
  test('webhook + entity trigger rejected', () => {
    const src = `workflow Bad { trigger { on:webhook(secret: S) on:create(User) } steps { delay { } } }`;
    const ast: any = parseLocus(src, 'bad_webhook.locus');
    const unified = mergeAsts([ast]);
    expect(()=>validateUnifiedAst(unified)).toThrow(/cannot combine 'on:webhook'/);
  });
});
