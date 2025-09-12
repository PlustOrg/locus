import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

// For now we simulate correlation by ensuring multiple missing entity references yield aggregated errors (future enhancement)

test('multiple files referencing missing entity produce single merged error message (placeholder)', () => {
  const f1 = parseLocus('database { entity A { id: Integer ref: belongs_to Missing } }','a.locus');
  const f2 = parseLocus('database { entity B { id: Integer ref: belongs_to Missing } }','b.locus');
  expect(()=>validateUnifiedAst(mergeAsts([f1,f2]))).toThrow(/Missing/);
});
