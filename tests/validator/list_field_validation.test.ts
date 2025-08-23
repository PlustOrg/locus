import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

describe('List field validation', () => {
  test('rejects optional list', () => {
    const src = 'database { entity Foo { tags: list of String? } }';
    const ast = parseLocus(src, 't');
    const unified = mergeAsts([ast as any]);
    expect(() => validateUnifiedAst(unified as any)).toThrow(/List field 'tags' cannot be marked optional/);
  });
  test('rejects default on list', () => {
    const src = 'database { entity Foo { tags: list of String (default: "x") } }';
    const ast = parseLocus(src, 't');
    const unified = mergeAsts([ast as any]);
    expect(() => validateUnifiedAst(unified as any)).toThrow(/cannot have a default/);
  });
});
