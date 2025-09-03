import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildProject } from '../../src/cli/build';

function tdir(){ return mkdtempSync(join(tmpdir(),'locus-auth-guards-')); }

describe('Auth guards syntax', () => {
  test('guard annotation includes guard comment and route in server', async () => {
    const dir = tdir();
    try {
  writeFileSync(join(dir,'models.locus'), 'database { entity User { id: Integer name: String } }');
  writeFileSync(join(dir,'features.locus'), 'page Dashboard(guard: admin) { ui { <div/> } }');
      writeFileSync(join(dir,'Locus.toml'), '[auth]\nadapter="./authAdapter.js"');
      writeFileSync(join(dir,'authAdapter.js'), 'module.exports={ getSession: async ()=> ({ id:1, roles:["admin"] }), requireRole:(role)=> (req,res,next)=> next() };');
      const out = join(dir,'generated');
      await buildProject({ srcDir: dir, outDir: out });
      const server = readFileSync(join(out,'server.ts'),'utf8');
  expect(server).toMatch(/Guard page Dashboard requires role admin/);
  expect(server).toMatch(/app.get\('\/guard\/dashboard', requireRole\('admin'\)/);
    } finally {
      try { rmSync(dir,{recursive:true, force:true}); }
      catch (e:any) {
        // Retry once after slight delay to handle macOS temp FS lag
        if (e && e.code === 'ENOTEMPTY' || e.code==='EACCES') {
          try { setTimeout(()=>{ try { rmSync(dir,{recursive:true, force:true}); } catch {/* ignore */} }, 50); } catch {/* ignore */}
        }
      }
    }
  });
});
