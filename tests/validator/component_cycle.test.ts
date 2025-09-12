import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

function tdir(){ return mkdtempSync(join(tmpdir(),'locus-comp-cycle-')); }

describe('component cycle detection', () => {
  test('detects circular component render dependency', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'A.locus'),'component A { ui { <B/> } }');
      writeFileSync(join(dir,'B.locus'),'component B { ui { <A/> } }');
      const res: any = await buildProject({ srcDir: dir, outDir: join(dir,'generated'), errorFormat: 'json' });
      expect(res.failed).toBe(true);
      const msg = JSON.stringify(res.diagnostics || res.meta || res);
      expect(/circular component/i.test(msg)).toBe(true);
    } finally { try { rmSync(dir,{recursive:true,force:true}); } catch {} }
  });
});
