import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

function run(src: string){
  const parsed = parseLocus(src, 'schema.locus');
  const merged:any = mergeAsts([parsed]);
  return validateUnifiedAst(merged);
}

describe('relation indexing hint', () => {
  test('multiple belongs_to without index triggers warning', () => {
    const res = run(`database { entity A { id: Integer } entity B { id: Integer a: belongs_to A b: belongs_to A } }`);
    const w = res.warnings.join('\n');
    expect(/Relation indexing hint: entity 'B'/i.test(w)).toBe(true);
  });
});
