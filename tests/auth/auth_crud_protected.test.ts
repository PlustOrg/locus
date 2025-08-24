import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildProject } from '../../src/cli/build';

function tdir(){ return mkdtempSync(join(tmpdir(), 'locus-auth-')); }

describe('Auth generation', () => {
  test('server.ts includes auth middleware when configured', async () => {
    const dir = tdir();
    try {
  writeFileSync(join(dir,'models.locus'), 'database { entity User { id: Integer name: String } }');
      writeFileSync(join(dir,'Locus.toml'), '[auth]\nadapter="./authAdapter.js"\nrequireAuth=true');
      writeFileSync(join(dir,'authAdapter.js'), 'module.exports={ getSession: async (req)=> req.headers["x-user"] ? { id:1, name:req.headers["x-user"] } : null };');
      const out = join(dir,'generated');
      await buildProject({ srcDir: dir, outDir: out });
      const server = readFileSync(join(out,'server.ts'),'utf8');
      expect(server).toMatch(/auth middleware/i);
      expect(server).toMatch(/getSession/);
    } finally { rmSync(dir,{recursive:true, force:true}); }
  });
});
