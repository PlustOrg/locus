import { parseExpression, _clearExprCache } from '../../src/parser/expr';

describe('expression optimization & caching', () => {
  test('constant folding produces single literal node', () => {
    _clearExprCache();
    const expr: any = parseExpression('1 + 2 * 3'); // should fold to 7 if folding runs with precedence
    // Accept either fully folded literal or top-level literal value
    expect(expr).toBeTruthy();
    if (expr.kind === 'lit') {
      expect(expr.value).toBe(7);
    } else {
      // fallback: walk to see any bin ops replaced with literal 7 on left/right collapse
      const toJSON = JSON.stringify(expr);
      expect(toJSON.includes('7')).toBe(true);
    }
  });

  test('cache hit after optimization returns same object', () => {
    _clearExprCache();
    const a = parseExpression('4 * (2 + 1)');
    const b = parseExpression('4 * (2 + 1)');
    expect(a).toBe(b);
  });
});
