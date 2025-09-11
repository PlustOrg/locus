import { parseLocus } from '../../src/parser';

test('else if quick-fix suggestion present', () => {
  const src = 'workflow W { steps { else if {} } }';
  try { parseLocus(src,'q.locus'); } catch (e: any) {
    expect(e.suggestions).toContain('elseif');
    return;
  }
  throw new Error('expected parse error');
});
