import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

const src = `workflow W { input { userId } steps { const userId = run fetchUser(userId) } trigger { t } }`;

describe('workflow binding reservation', () => {
  test('binding shadows input name', () => {
    const ast: any = parseLocus(src, 'w.locus');
    const unified = mergeAsts([ast]);
    expect(()=>validateUnifiedAst(unified)).toThrow(/shadows reserved input\/state name/);
  });
});
