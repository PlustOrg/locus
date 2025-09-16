import { PRIMITIVE_TOKEN_NAMES } from '../../src/parser/primitiveTypes';
import { mapPrimitiveToken } from '../../src/parser/builders/helpers';

describe('primitive mapping table', () => {
  test('all primitives map correctly', () => {
    for (const tok of PRIMITIVE_TOKEN_NAMES) {
      const mapped = mapPrimitiveToken(tok);
      expect(mapped).toBe(tok.replace(/T$/, ''));
    }
  });
  test('fallback defaults to String', () => {
    expect(mapPrimitiveToken('NonExistentTok')).toBe('String');
  });
});
