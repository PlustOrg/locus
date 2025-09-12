import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

function tdir(){ return mkdtempSync(join(tmpdir(),'locus-wf-dep-')); }

describe('workflow step dependency analysis', () => {
  test('referencing later binding causes validation error', async () => {
    const dir = tdir();
    try {
  writeFileSync(join(dir,'w.locus'),`page Home { ui { <div/> } action use {} action produce {} } workflow W { trigger { t } steps { run use(val: later) const later = run produce() } }`);
      const res: any = await buildProject({ srcDir: dir, outDir: join(dir,'gen'), errorFormat: 'json' });
      const diags = JSON.stringify(res.diagnostics||[]);
      expect(/step dependency/i.test(diags)).toBe(true);
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });
  test('unused binding emits warning', async () => {
    const dir = tdir();
    try {
  writeFileSync(join(dir,'w.locus'),`page Home { ui { <div/> } action produce {} } workflow W { trigger { t } steps { const temp = run produce() } }`);
      const res: any = await buildProject({ srcDir: dir, outDir: join(dir,'gen'), dryRun: true });
      const warns = res.meta?.warnings?.join('\n') || '';
      expect(/unused workflow binding/i.test(warns)).toBe(true);
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });
});
