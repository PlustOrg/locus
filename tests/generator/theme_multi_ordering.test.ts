import { generateCssVariables } from '../../src/generator/theme';

describe('Theme multiple ordering deterministic', () => {
  test('themes sorted by insertion order of object keys (JS preserves) but token lines stable', () => {
    const ds: any = { colors: { light: { primary: { value: '#111111' }, secondary: { value: '#222222' } }, dark: { primary: { value: '#aaaaaa' }, secondary: { value: '#bbbbbb' } } } };
    const css = generateCssVariables(ds);
    const first = generateCssVariables(ds);
    expect(css).toBe(first);
    // Ensure primary appears before secondary within each block
    const lightBlock = css.split(/\[data-theme="light"\]/)[1];
    expect(lightBlock.indexOf('--color-primary')).toBeLessThan(lightBlock.indexOf('--color-secondary'));
  });
});
