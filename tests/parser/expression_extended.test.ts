import { parseExpression } from '../../src/parser/expr';

describe('extended expression grammar', () => {
  test('comparison precedence', () => {
    const expr: any = parseExpression('a + b * c > d');
    expect(expr.op).toBe('>');
    expect(expr.left.op).toBe('+');
    expect(expr.left.right.op).toBe('*');
  });
  test('call expression with member', () => {
    const expr: any = parseExpression('util.sum(a, b + c) * d');
    expect(expr.op).toBe('*');
    expect(expr.left.kind).toBe('call');
    expect(expr.left.args[1].op).toBe('+');
  });
});
