import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

test('paren attribute emits deprecation warning', () => {
  const src = `database { entity User { name: String (unique) } }`;
  const ast = mergeAsts([parseLocus(src,'x.locus')]);
  validateUnifiedAst(ast as any);
  const warns = (ast as any).namingWarnings || [];
  expect(warns.some((w:string)=>/Deprecated.*attribute/.test(w))).toBe(true);
});
