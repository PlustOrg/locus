import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

function validate(src:string){
  const ast = mergeAsts([parseLocus(src,'db.locus')]);
  return validateUnifiedAst(ast);
}

describe('cascade policy validation', () => {
  test.skip('set_null on non-nullable relation errors (deferred until nullable relations supported)', () => {
    const src = `database { entity A { id: Integer } entity B { id: Integer a: belongs_to A on_delete: set_null } }`;
    expect(()=>validate(src)).toThrow(/set_null requires nullable or optional relation/i);
  });
  test('placeholder passes (no validation yet)', () => {
    const src = `database { entity A { id: Integer } entity B { id: Integer a: belongs_to A on_delete: cascade } }`;
    expect(()=>validate(src)).not.toThrow();
  });
});
