import { parseLocus } from '../../src/parser';

describe('Component multiple style:override blocks', () => {
  test('last block wins (current behavior)', () => {
  const src = 'component Styled { ui { <div/> } style:override { .a { color: red; } } style:override { .a { color: blue; } } }';
  const ast = parseLocus(src, 'test.locus');
    const comp = ast.components[0];
  expect((comp as any).styleOverrides.length).toBe(2);
  expect((comp as any).styleOverrides[0].content).toContain('color: red');
  expect((comp as any).styleOverrides[1].content).toContain('color: blue');
  expect(comp.styleOverride).toContain('color: blue');
  });
});
