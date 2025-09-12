import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

function tdir(){ return mkdtempSync(join(tmpdir(),'locus-wf-complex-')); }

describe('workflow complexity warnings', () => {
  test('emits naming warning when step count exceeds threshold', async () => {
    const dir = tdir();
    try {
  const steps = Array.from({length:60},()=>`    delay { for: "1s" }`).join('\n');
  process.env.LOCUS_WORKFLOW_COMPLEXITY_THRESHOLD = '50';
  const wf = `workflow Heavy {\n  trigger { t }\n  steps {\n${steps}\n  }\n}`;
  writeFileSync(join(dir,'wf.locus'),wf);
      const res: any = await buildProject({ srcDir: dir, outDir: join(dir,'generated'), dryRun: true });
      const warns = res.meta?.warnings?.join('\n') || '';
      expect(/complexity/.test(warns)).toBe(true);
    } finally { try { rmSync(dir,{recursive:true,force:true}); } catch {} }
  });
});
