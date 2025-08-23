import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Build dry-run still includes warnings metadata (no file write)', () => {
  test('dry run returns warnings in meta', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'locus-dry-'));
    try {
      writeFileSync(join(dir, 'c.locus'), 'component C { ui { <div>{children}</div> } }');
      const res: any = await buildProject({ srcDir: dir, dryRun: true });
      expect(res.meta.warnings.length).toBe(1);
      // No GENERATED_WARNINGS.txt file written because dryRun
      const files = readdirSync(dir);
      expect(files).not.toContain('GENERATED_WARNINGS.txt');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
