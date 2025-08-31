import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';
import { VError } from '../../src/errors';

function unify(src: string) {
  const ast = parseLocus(src, 'test.workflow.locus');
  return mergeAsts([ast]);
}

describe('workflow validation (Phase 3)', () => {
  test('missing trigger', () => {
    const src = `workflow W { steps { run doThing() } }`;
    const unified = unify(src);
    expect(() => validateUnifiedAst(unified)).toThrow(VError);
  });
  test('missing steps', () => {
    const src = `workflow W { trigger { on:create(Entity) } }`;
    const unified = unify(src);
    expect(() => validateUnifiedAst(unified)).toThrow(VError);
  });
  test('valid minimal workflow', () => {
    const src = `workflow W { trigger { on:create(Order) } steps { run act() } }`;
    const unified = unify(src);
    expect(() => validateUnifiedAst(unified)).not.toThrow();
  });
  test('incompatible webhook + entity', () => {
    const src = `workflow W { trigger { on:webhook on:create(Order) } steps { run act() } }`;
    const unified = unify(src);
  expect(() => validateUnifiedAst(unified)).toThrow(/cannot mix webhook and entity triggers/);
  });
});
