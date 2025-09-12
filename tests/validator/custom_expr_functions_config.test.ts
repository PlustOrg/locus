import { validateUnifiedAst } from '../../src/validator/validate';
import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

// Simulate config extension by temporarily mutating global allowed set (exposed via hook we'll add)
import { __injectCustomExpressionFunctions, __resetCustomExpressionFunctions } from '../../src/validator/exprFunctions';

afterEach(()=>__resetCustomExpressionFunctions());

test('custom expression function allowed via config injection', () => {
  __injectCustomExpressionFunctions(['slugify']);
  const src = `component X { <Text value={slugify(children)} /> }`;
  const ast:any = mergeAsts([parseLocus(src,'ui.locus')]);
  const res = validateUnifiedAst(ast);
  expect(res.warnings.join('\n')).not.toMatch(/unknown identifier 'slugify'/i);
});
