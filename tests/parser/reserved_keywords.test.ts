import { parseLocus } from '../../src/parser';

describe('Reserved structural keywords (Phase 1)', () => {
  test('forEach requires explicit in token', () => {
    // Using identifier 'inn' should still work; misuse of missing in should error
    expect(() => parseLocus('workflow W { steps { forEach item list { } } }')).toThrow();
  });

  test('else must use else keyword, not identifier', () => {
    // Use branch with steps and else blocks
    const ok = parseLocus('workflow W { steps { branch { steps { delay { } } else { delay { } } } } }');
    expect(ok.workflows?.length).toBe(1);
  });

  test('guard clause uses guard keyword', () => {
    const ok = parseLocus('page Home (guard: Admin) { }');
    expect(ok.pages.length).toBe(1);
  });

  test('list optional forbidden at parse', () => {
    expect(() => parseLocus('database { entity X { tags: list of String? } }')).toThrow();
  });
});
