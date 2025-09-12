import { parseLocus } from '../../src/parser';

test('quick-fix suggestions expose fixes array', () => {
  const src = 'workflow W { steps { else if {} } }';
  try { parseLocus(src,'f.locus'); } catch (e: any) {
    expect(Array.isArray(e.fixes)).toBe(true);
    expect(e.fixes.some((f: any)=>/elseif/.test(f.replacement))).toBe(true);
    return;
  }
  throw new Error('Expected parse error with fixes');
});
