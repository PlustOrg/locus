import { parseExpression, _clearExprCache } from '../../src/parser/expr';

describe('expression cache', () => {
  test('reuses AST object for identical text', () => {
    _clearExprCache();
    const a = parseExpression('a && b');
    const b = parseExpression('a && b');
    expect(a).toBe(b); // same object
  });
});
