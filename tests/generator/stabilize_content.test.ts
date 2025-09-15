import { stabilizeContent } from '../../src/generator/stabilize';

it('redacts volatile substrings', () => {
  // Use double escaping to survive JS string -> regex replacement; ensure backslashes present
  const input = '2025-09-14T12:34:56.789Z listening on :3001 /var/folders/abc123/tmp /Users/testuser something C:\\\\Users\\\\WinUser';
  const out = stabilizeContent(input);
  expect(out).toContain('<ISO_TIMESTAMP>');
  expect(out).toContain(':<PORT>');
  expect(out).toContain('<TMP_DIR>');
  expect(out).toContain('<HOME>');
  expect(out).toContain('<WIN_HOME>');
});
