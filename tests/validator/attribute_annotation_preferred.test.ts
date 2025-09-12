import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

describe('attribute normalization', () => {
  test('annotation syntax does not emit deprecation warning', () => {
    const src = `database { entity User { id: Integer name: String @unique } }`;
    const ast:any = mergeAsts([parseLocus(src,'db.locus')]);
    const res = validateUnifiedAst(ast);
    const w = res.warnings.join('\n');
    expect(/deprecated/i.test(w)).toBe(false);
  });
});
