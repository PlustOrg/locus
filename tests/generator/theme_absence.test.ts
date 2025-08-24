import { generateCssVariables } from '../../src/generator/theme';

describe('Theme absence placeholder', () => {
  test('generates placeholder comment when no design system', () => {
    const css = generateCssVariables(undefined);
    expect(css).toMatch(/no design system colors defined/);
  });
});
