import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

const SRC = `database { entity User { id: Integer name: String (unique) } }`;

describe('legacy paren attribute removal gate', () => {
  const prev = process.env.REMOVE_PAREN_ATTRS;
  afterAll(()=> { if (prev==null) delete process.env.REMOVE_PAREN_ATTRS; else process.env.REMOVE_PAREN_ATTRS = prev; });
  test('throws when gate enabled', () => {
    process.env.REMOVE_PAREN_ATTRS = '1';
    const ast = parseLocus(SRC, 'file.locus');
    const merged = mergeAsts([ast]);
    expect(()=>validateUnifiedAst(merged)).toThrow(/Legacy paren attribute syntax/);
  });
  test('allows when gate disabled', () => {
    process.env.REMOVE_PAREN_ATTRS = '0';
    const ast = parseLocus(SRC, 'file.locus');
    const merged = mergeAsts([ast]);
    expect(()=>validateUnifiedAst(merged)).not.toThrow();
  });
});
