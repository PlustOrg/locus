import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';
import { VError } from '../../src/errors';

describe('Validator: design_system token naming locs', () => {
  test('invalid weight key provides location', () => {
    const src = `design_system { typography { weights { BadKey: 700 } } }`;
    const ast = parseLocus(src);
    const unified = mergeAsts([ast]);
    try {
      validateUnifiedAst(unified);
      throw new Error('Expected validation to fail');
    } catch (e: any) {
      expect(e instanceof VError).toBe(true);
      expect(typeof e.line === 'number' && typeof e.column === 'number').toBe(true);
    }
  });
});
