import { parseLocus } from '../../src/parser';

describe('Unterminated style:override', () => {
  test('throws PError with location', () => {
    const src = 'component X { ui { <div/> } style:override { .a { color: red; } ';
    try {
      parseLocus(src, 'x.locus');
      throw new Error('Expected error');
    } catch (e: any) {
      expect(e.message).toMatch(/Unterminated style:override block/);
      expect(e.line).toBe(1);
      expect(e.column).toBeGreaterThan(0);
    }
  });
});
