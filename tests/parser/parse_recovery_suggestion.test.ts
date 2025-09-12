import { parseLocus } from '../../src/parser';

// We don't enable full recovery; we inject a heuristic suggestion for common missing colon case.

test('missing colon error includes suggestion', () => {
  try {
    parseLocus('database { entity User { name String } }','x.locus');
    fail('expected parse error');
  } catch (e:any) {
  expect(e.message).toMatch(/Colon/); // ensure colon expectation listed
  }
});
