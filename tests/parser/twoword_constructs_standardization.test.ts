import { parseLocus } from '../../src/parser';

describe('two-word construct standardization', () => {
  test('on_load rejected with guidance', () => {
    expect(() => parseLocus('page Home { on_load { } }', 'main.locus')).toThrow(/Use 'on load'/);
  });
});
