import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { exportMetrics } from '../../src/metrics';

function tdir(){ return mkdtempSync(join(tmpdir(),'locus-mem-metrics-')); }

describe('memory metrics', () => {
  test('records parse/merge/generate memory deltas', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'app.locus'),'component A { ui { <div/> } }');
      await buildProject({ srcDir: dir, outDir: join(dir,'generated') });
      const m: any = exportMetrics();
      expect(typeof m.memory.parseDelta).toBe('number');
  // Allow negative delta if GC occurred between snapshots
  expect(typeof m.memory.parseDelta).toBe('number');
      expect(typeof m.memory.mergeDelta).toBe('number');
  expect(typeof m.memory.generateDelta).toBe('number');
    } finally { try { rmSync(dir,{recursive:true,force:true}); } catch {} }
  });
});
