import { parseExpression } from '../../src/parser/expr';
import { evaluateExpr } from '../../src/workflow/runtime';

describe('expression evaluation sandbox', () => {
  test('blocks access to dangerous prototype properties', () => {
    const expr: any = parseExpression('user.constructor');
    const val = evaluateExpr(expr, { bindings: { user: {} }, actions: {}, inputs: {}, log: [] });
    expect(val).toBeUndefined();
  });
});
