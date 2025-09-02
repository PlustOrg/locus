import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

const SRC = `database { entity Legacy { title: String (unique) status: String (default: "draft") } }`;

describe('legacy paren attributes remain parseable', () => {
  test('parse + merge + validate succeeds (without removal gate)', () => {
    delete process.env.REMOVE_PAREN_ATTRS;
    const ast = parseLocus(SRC, 'legacy.locus');
    const merged = mergeAsts([ast]);
    expect(()=>validateUnifiedAst(merged)).not.toThrow();
  });
});
