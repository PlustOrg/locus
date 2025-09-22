import { parseLocus } from '../../src/parser';

describe('AST dev freeze', () => {
  test('not frozen by default', () => {
    const ast = parseLocus('component A { ui { <div/> } }', 'a.locus');
    expect(Object.isFrozen(ast)).toBe(false);
  });
  test('frozen when LOCUS_DEV_FREEZE=1', () => {
    process.env.LOCUS_DEV_FREEZE = '1';
    const ast = parseLocus('component B { ui { <div/> } }', 'b.locus');
    expect(Object.isFrozen(ast)).toBe(true);
    delete process.env.LOCUS_DEV_FREEZE;
  });
});
