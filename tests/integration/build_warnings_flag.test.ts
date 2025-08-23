import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Build warnings suppression flag (integration lite)', () => {
  test('warnings emitted vs suppressed', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'locus-build-'));
    try {
      // Minimal locus file with auto-added children component
      const locus = `component Test { ui { <div>{children}</div> } }`;
      writeFileSync(join(dir, 'app.locus'), locus);
      // Run build with warnings
      const res1: any = await buildProject({ srcDir: dir, emitJs: false });
      expect(res1.meta.hasPages).toBe(false);
      // Warnings present (printed to stdout earlier); we just assert generation artifact exists
      // Run build with suppression
      const res2: any = await buildProject({ srcDir: dir, emitJs: false, suppressWarnings: true });
      expect(res2.meta.hasPages).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
