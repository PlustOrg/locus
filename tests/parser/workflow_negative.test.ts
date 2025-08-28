import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';
import { PError, VError } from '../../src/errors';

describe('workflow negative parsing/validation', () => {
  test('missing steps block', () => {
    const src = `workflow W { trigger { on:create(A) } }`;
    const ast = parseLocus(src, 'w.locus');
    const unified = mergeAsts([ast]);
    expect(() => validateUnifiedAst(unified)).toThrow(VError);
  });
  test('missing trigger block', () => {
    const src = `workflow W { steps { run a() } }`;
    const ast = parseLocus(src, 'w.locus');
    const unified = mergeAsts([ast]);
    expect(() => validateUnifiedAst(unified)).toThrow(VError);
  });
  test('duplicate const binding', () => {
    const src = `workflow W { trigger { on:create(A) } steps { const x = run a() const x = run b() } }`;
    const ast = parseLocus(src, 'w.locus');
    const unified = mergeAsts([ast]);
    expect(() => validateUnifiedAst(unified)).toThrow(VError);
  });
  test('incompatible webhook and entity triggers', () => {
    const src = `workflow W { trigger { on:webhook on:create(A) } steps { run a() } }`;
    const ast = parseLocus(src, 'w.locus');
    const unified = mergeAsts([ast]);
    expect(() => validateUnifiedAst(unified)).toThrow(VError);
  });
  test('malformed step (unexpected token)', () => {
    const src = `workflow W { trigger { on:create(A) } steps { run a(, ) } }`;
    expect(() => parseLocus(src, 'bad.locus')).toThrow(PError);
  });
});
