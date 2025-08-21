import { mergeAsts } from '../../src/parser/merger';
import { parseLocus } from '../../src/parser';
import { validateUnifiedAst } from '../../src/validator/validate';
import { VError } from '../../src/errors';

describe('Validator: duplicate fields', () => {
  test('duplicate field names in entity produce VError with location', () => {
    const src = `database { entity User { id: Integer id: Integer } }`;
    const ast = parseLocus(src);
    const unified = mergeAsts([ast]);
    expect(() => validateUnifiedAst(unified)).toThrow(VError);
  });
});
