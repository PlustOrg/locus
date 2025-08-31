import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

test('policy attribute valid on belongs_to', () => {
  const src = `database { entity A { name: String } entity B { a: belongs_to A (policy: cascade) } }`;
  const ast1 = parseLocus(src, 'mem.locus');
  const unified = mergeAsts([ast1]);
  expect(() => validateUnifiedAst(unified)).not.toThrow();
});

test('policy invalid on has_many', () => {
  const src = `database { entity A { name: String } entity B { a: has_many A (policy: cascade) } }`;
  const ast1 = parseLocus(src, 'mem.locus');
  const unified = mergeAsts([ast1]);
  expect(() => validateUnifiedAst(unified)).toThrow(/Policy attribute only supported/);
});
