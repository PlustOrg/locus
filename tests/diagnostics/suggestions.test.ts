import { computeSuggestions } from '../../src/diagnostics/suggestions';

describe('suggestions engine', () => {
  test('elseif hint for else if', () => {
    const s = computeSuggestions("Unexpected token: else if");
    expect(s).toContain('elseif');
  });
  test('on_delete for on delete', () => {
    const s = computeSuggestions("found --> 'on delete' <--");
    expect(s).toContain('on_delete');
  });
  test('keyword distance', () => {
    const s = computeSuggestions("Unexpected token: databse");
    expect(s).toContain('database');
  });
});
