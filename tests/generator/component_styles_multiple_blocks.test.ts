import { parseLocus } from '../../src/parser';

describe('Component multiple style:override blocks', () => {
  test('last block wins (current behavior)', () => {
    const src = 'component Styled { ui { <div/> } style:override { .a { color: red; } } style:override { .a { color: blue; } }';
  const ast = parseLocus(src, 'test.locus');
    const comp = ast.components[0];
  // eslint-disable-next-line no-console
  console.log('STYLE OVERRIDE VALUE:', comp.styleOverride);
    expect(comp.styleOverride).toContain('color: blue');
  });
});
