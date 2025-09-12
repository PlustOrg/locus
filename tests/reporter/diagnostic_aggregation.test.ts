import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

function tdir(){ return mkdtempSync(join(tmpdir(),'locus-diag-agg-')); }

describe('diagnostic aggregation', () => {
  test('outputs summary counts per code in json format', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'bad.locus'),'component X { ui { <div> ');
      const res: any = await buildProject({ srcDir: dir, outDir: join(dir,'generated'), errorFormat: 'json' });
      expect(res.failed).toBe(true);
      expect(res.summary).toBeTruthy();
      const codes = Object.keys(res.summary);
      expect(codes.length).toBeGreaterThan(0);
    } finally { try { rmSync(dir,{recursive:true,force:true}); } catch {} }
  });
});
