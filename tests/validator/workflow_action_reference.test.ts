import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

describe('workflow action reference validation', () => {
  test('unknown action rejected', () => {
    const src = `page P { action doThing() {} }
workflow W { trigger { on:create(Entity) } steps { run missingAction() } }`;
    const ast = parseLocus(src, 'w.locus');
    const unified = mergeAsts([ast]);
    expect(()=>validateUnifiedAst(unified)).toThrow(/unknown action 'missingAction'/);
  });
  test('known action accepted', () => {
    const src = `page P { action doThing() {} }
workflow W { trigger { on:create(Entity) } steps { run doThing() } }`;
    const ast = parseLocus(src, 'w2.locus');
    const unified = mergeAsts([ast]);
    validateUnifiedAst(unified); // should not throw
  });
});
