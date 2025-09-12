import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

function tdir(){ return mkdtempSync(join(tmpdir(),'locus-expr-fn-')); }

describe('expression function whitelist', () => {
  test('rejects disallowed function call in workflow condition', async () => {
    const dir = tdir();
    try {
      process.env.LOCUS_ALLOWED_EXPR_FUNCS = 'safeFn';
  writeFileSync(join(dir,'wf.locus'),`workflow W { trigger { t } steps { branch { condition: { danger() } steps { run a() } } } }`);
      const res: any = await buildProject({ srcDir: dir, outDir: join(dir,'generated'), errorFormat: 'json' });
  expect(res.failed).toBe(true); // whitelist rejection should mark failed
      const msg = JSON.stringify(res.diagnostics || []);
      expect(/disallowed function/i.test(msg)).toBe(true);
    } finally { try { rmSync(dir,{recursive:true,force:true}); } catch {} }
  });
  test('allows whitelisted function', async () => {
    const dir = tdir();
    try {
      process.env.LOCUS_ALLOWED_EXPR_FUNCS = 'safeFn';
  writeFileSync(join(dir,'wf.locus'),`workflow W { trigger { t } steps { branch { condition: { safeFn() } steps { run a() } } } }`);
      const res: any = await buildProject({ srcDir: dir, outDir: join(dir,'generated'), dryRun: true });
  expect(res.failed).not.toBe(true);
    } finally { try { rmSync(dir,{recursive:true,force:true}); } catch {} }
  });
});
