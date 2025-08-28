import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';
import { VError } from '../../src/errors';

describe('workflow binding shadowing', () => {
  test('duplicate const binding errors', () => {
    const src = `workflow W { trigger { on:create(Order) } steps { const x = run a() const x = run b() } }`;
    const unified = mergeAsts([parseLocus(src, 'dup.locus')]);
    expect(() => validateUnifiedAst(unified)).toThrow(VError);
  });
});
