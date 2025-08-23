import { generateCssVariables } from '../../src/generator/theme';

describe('Theme CSS generation', () => {
  test('emits value not [object Object]', () => {
    const ds: any = { colors: { light: { primary: { value: '#ffffff' } } } };
    const css = generateCssVariables(ds);
    expect(css).toContain('--color-primary: #ffffff;');
    expect(css).not.toContain('[object Object]');
  });
  test('empty design system message', () => {
    const css = generateCssVariables(undefined as any);
    expect(css).toContain('no design system colors');
  });
});
