import { generateCssVariables } from '../../src/generator/theme';

describe('design token ordering deterministic', () => {
  test('themes and tokens sorted', () => {
    const ds: any = { type: 'design_system', colors: { bTheme: { z: '#000000', a: '#111111' }, aTheme: { m: '#222222', k: '#333333' } } };
    const css = generateCssVariables(ds);
    const lines = css.trim().split(/\n/);
    // Expect aTheme block before bTheme
    const aIdx = lines.findIndex(l=>l.includes('[data-theme="aTheme"]'));
    const bIdx = lines.findIndex(l=>l.includes('[data-theme="bTheme"]'));
    expect(aIdx).toBeLessThan(bIdx);
    // Inside aTheme expect k before m
    const aBlock = lines.slice(aIdx, lines.indexOf('}', aIdx));
    const kIdx = aBlock.findIndex(l=>l.includes('--color-k'));
    const mIdx = aBlock.findIndex(l=>l.includes('--color-m'));
    expect(kIdx).toBeLessThan(mIdx);
  });
});
