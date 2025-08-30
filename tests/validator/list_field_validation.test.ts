import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

describe('List field validation', () => {
  // Optional list syntax now rejected by parser earlier (Phase 1 overhaul) – retain only default check.
  test('rejects default on list', () => {
    const src = 'database { entity Foo { tags: list of String (default: "x") } }';
    const ast = parseLocus(src, 't');
    const unified = mergeAsts([ast as any]);
    expect(() => validateUnifiedAst(unified as any)).toThrow(/cannot have a default/);
  });
});
