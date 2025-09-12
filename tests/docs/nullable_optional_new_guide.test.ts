import { readFileSync } from 'fs';
import { join } from 'path';

describe('nullable/optional migration guide doc', () => {
  test('guide exists and has key sections', () => {
    const p = join(process.cwd(),'docs/guides/nullable-optional-migration.md');
    const txt = readFileSync(p,'utf8');
    expect(/Nullable vs Optional Migration Guide/.test(txt)).toBe(true);
    expect(/Migration Steps/.test(txt)).toBe(true);
    expect(/Quick Reference/.test(txt)).toBe(true);
  });
});
