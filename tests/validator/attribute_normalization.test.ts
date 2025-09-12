import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildProject } from '../../src/cli/build';

function tdir(){ return mkdtempSync(join(tmpdir(),'locus-attr-norm-')); }

describe('attribute normalization', () => {
  test('parentheses style attribute emits deprecation warning', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'m.locus'),`database { entity Post { id: Integer title: String (unique) } }`);
      const res: any = await buildProject({ srcDir: dir, outDir: join(dir,'gen'), dryRun: true });
      const warns = res.meta?.warnings?.join('\n') || '';
      expect(/deprecated attribute syntax/i.test(warns)).toBe(true);
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });
  test('@attribute style has no deprecation warning', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'m.locus'),`database { entity Post { id: Integer title: String @unique } }`);
      const res: any = await buildProject({ srcDir: dir, outDir: join(dir,'gen'), dryRun: true });
      const warns = res.meta?.warnings?.join('\n') || '';
      expect(/deprecated attribute syntax/i.test(warns)).toBe(false);
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });
});
