import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

describe('integer overflow protection', () => {
  test('integer default literal overflow', () => {
    const src = `database { entity A { id: Integer big: Integer @default(99999999999) } }`;
    const ast = mergeAsts([parseLocus(src,'db.locus')]);
    expect(()=>validateUnifiedAst(ast)).toThrow(/overflow/i);
  });
});
