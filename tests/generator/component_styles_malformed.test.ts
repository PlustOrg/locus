import { parseLocus } from '../../src/parser';

describe('Component style malformed', () => {
  test('unexpected tokens after style still parse', () => {
    const src = 'component Weird { ui { <div/> } style:override { .a { color: red; } EXTRA TOKENS HERE }';
  const ast = parseLocus(src, 'test.locus');
  const comp = ast.components[0];
    // styleOverride may be undefined but parser shouldn't throw
    expect(comp.name).toBe('Weird');
  });
});
