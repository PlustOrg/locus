import { parseLocus } from '../../src/parser';

describe('diagnostic severity', () => {
  test('parse error exposes severity', () => {
    try {
      parseLocus('entity X { }', 'main.locus'); // invalid top-level
      throw new Error('expected parse error');
    } catch (e: any) {
      expect(e.severity).toBe('error');
    }
  });
});
