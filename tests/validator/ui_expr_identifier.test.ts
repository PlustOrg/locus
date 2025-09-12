import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildProject } from '../../src/cli/build';

describe('ui expr identifier validation', () => {
  test('unknown identifier in ui attr produces warning', async () => {
    const dir = mkdtempSync(join(tmpdir(),'locus-ui-expr-'));
    try {
      writeFileSync(join(dir,'app.locus'), `page Demo { ui { <div title={unknownVar + 1}></div> } }`);
      const res:any = await buildProject({ srcDir: dir, dryRun: true });
      const warns = (res.meta?.warnings||[]).join('\n');
      expect(/Unknown identifier 'unknownVar'/i.test(warns)).toBe(true);
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });

  test('bounds checking warning for unbounded forEach', async () => {
    const dir = mkdtempSync(join(tmpdir(),'locus-ui-bounds-'));
    try {
      writeFileSync(join(dir,'app.locus'), `page Demo { ui { <ul><li for:each={items}>{item}</li></ul> } }`);
      const res:any = await buildProject({ srcDir: dir, dryRun: true });
      const warns = (res.meta?.warnings||[]).join('\n');
      expect(/Bounds checking: unbounded iteration over 'items'/i.test(warns)).toBe(true);
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });
});
