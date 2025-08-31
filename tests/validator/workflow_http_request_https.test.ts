import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

describe('workflow http_request https enforcement', () => {
  test('rejects insecure without allow_insecure', () => {
    const src = `workflow W { trigger { on:create(Thing) } steps { http_request { url: "http://insecure.test" } } }`;
    const ast = parseLocus(src, 'h1.locus');
    const unified = mergeAsts([ast]);
    expect(()=>validateUnifiedAst(unified)).toThrow(/must use HTTPS/);
  });
  test('allows insecure with allow_insecure flag', () => {
    const src = `workflow W { trigger { on:create(Thing) } steps { http_request { url: "http://insecure.test" allow_insecure: true } } }`;
    const ast = parseLocus(src, 'h2.locus');
    const unified = mergeAsts([ast]);
    validateUnifiedAst(unified);
  });
});
