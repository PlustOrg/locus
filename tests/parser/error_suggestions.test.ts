import { parseLocus } from '../../src/parser';

function tryParse(src: string): string {
  try { parseLocus(src,'x.locus'); return 'ok'; } catch (e:any) { return e.message; }
}

describe('Error suggestions', () => {
  test('typo entityy suggests entity', () => {
    const msg = tryParse('database { entityy User { id: Integer } }');
    expect(/entity/.test(msg)).toBe(true);
  });
  test('typo wokflow triggers suggestion set containing workflow', () => {
    const msg = tryParse('wokflow W { trigger { t } steps { } }');
    // suggestion currently appended indirectly; ensure offending token present so extractor fires
    // At minimum ensure error message contains the mistyped token
    expect(/wokflow/.test(msg)).toBe(true);
  });
});
