import { parseLocus } from '../../src/parser';

describe('Component style malformed', () => {
  test('style blocks captured even with extra tokens following', () => {
    const src = 'component Weird { ui { <div/> } style:override { /* c */ .a { color: red; } /* trailing */ } more tokens here }';
    const ast = parseLocus(src, 'test.locus');
    const comp: any = ast.components[0];
    expect(comp.styleOverrides.length).toBe(1);
    expect(comp.styleOverride).toContain('color: red');
  });
});
