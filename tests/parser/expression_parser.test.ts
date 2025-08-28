import { parseExpression } from '../../src/parser/expr';

describe('expression parser', () => {
  test('basic binary precedence', () => {
    const expr = parseExpression('a + b * c');
    expect(expr?.kind).toBe('bin');
    const bin: any = expr;
    expect(bin.op).toBe('+');
    expect(bin.right.op).toBe('*');
  });
  test('logical precedence', () => {
    const expr = parseExpression('a == b || c && !d');
    const bin: any = expr;
    expect(bin.op).toBe('||');
    expect(bin.right.op).toBe('&&');
  });
  test('member access and parens', () => {
    const expr = parseExpression('(user.profile).name');
  const mem: any = (expr as any).kind === 'member' ? expr : (expr as any).expr || expr;
  // unwrap paren
  const target = (mem.kind === 'member') ? mem : (mem.kind === 'paren' ? mem.expr : mem);
  expect(target.kind === 'member' || target.kind === 'paren').toBe(true);
  });
});
