import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { exportMetrics } from '../../src/metrics';

function tdir(){ return mkdtempSync(join(tmpdir(),'locus-diag-metrics-')); }

describe('diagnostic metrics', () => {
  test('captures diagnostic count on parse error', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'bad.locus'),'component X { ui { <div> '); // unterminated
      await buildProject({ srcDir: dir, outDir: join(dir,'generated'), errorFormat: 'json' });
      const m: any = exportMetrics();
      expect(m.diagnostics.count).toBeGreaterThan(0);
    } finally { try { rmSync(dir,{recursive:true,force:true}); } catch {} }
  });
});
