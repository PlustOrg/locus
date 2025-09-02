import crypto from 'crypto';
import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function hashDir(dir: string): string {
  const manifest = JSON.parse(readFileSync(join(dir,'BUILD_MANIFEST.json'),'utf8'));
  const files: string[] = manifest.files;
  const contents = files.sort().map(f=>readFileSync(join(dir,f),'utf8')).join('\n--FILE--\n');
  return crypto.createHash('sha256').update(contents).digest('hex');
}

describe('full build hash determinism', () => {
  test('two builds have identical hash', async () => {
    const src = mkdtempSync(join(tmpdir(),'locus-hash-src-'));
    // minimal locus file
  writeFileSync(join(src,'app.locus'), 'database {\n  entity User {\n    userId: Integer\n    name: String\n  }\n}');
    const out1 = join(src,'gen1');
    const out2 = join(src,'gen2');
    await buildProject({ srcDir: src, outDir: out1, suppressWarnings: true, dryRun: false });
    await buildProject({ srcDir: src, outDir: out2, suppressWarnings: true, dryRun: false });
    const h1 = hashDir(out1);
    const h2 = hashDir(out2);
    expect(h1).toBe(h2);
    rmSync(src, { recursive: true, force: true });
  });
});
