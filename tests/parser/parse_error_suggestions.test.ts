import { parseLocus } from '../../src/parser';

test('on_load suggestion snippet present', () => {
  try { parseLocus('page Home { on_load { } }','s.locus'); } catch (e: any) {
    expect(e.suggestions).toContain("on load");
    return;
  }
  throw new Error('expected parse error');
});
