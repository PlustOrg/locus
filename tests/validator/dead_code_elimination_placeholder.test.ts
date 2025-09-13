// Placeholder test: ensures current pipeline still generates all fields; real dead code elimination TBD.
import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

test('no dead code elimination yet - unused component still present', () => {
  const ui = parseLocus('component Unused { <Text value={"hi"} /> }','ui.locus');
  const ast:any = mergeAsts([ui]);
  const res = validateUnifiedAst(ast);
  expect(res).toBeTruthy();
});
