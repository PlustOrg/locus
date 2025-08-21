import { parseLocus } from '../../src/parser';

describe('Parser error snapshots', () => {
  test('missing colon', () => {
    expect(() => parseLocus('database { entity User { name String } }'))
      .toThrow();
  });

  test('unexpected string', () => {
    expect(() => parseLocus('database { entity User { "oops" } }'))
      .toThrow();
  });

  test('unexpected RCurly', () => {
    expect(() => parseLocus('database { entity User } }'))
      .toThrow();
  });
});
