import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildProject } from '../../src/cli/build';

function tdir(){ return mkdtempSync(join(tmpdir(),'locus-auth-jwtrt-')); }

describe('JWT roundtrip helpers', () => {
  test('generateToken / verifyToken code paths present', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'models.locus'),'database { entity User { id: Integer name: String } }');
      writeFileSync(join(dir,'Locus.toml'),'[auth]\nadapter="./authAdapter.js"\njwtSecret="DEVSECRET"');
      writeFileSync(join(dir,'authAdapter.js'),'module.exports={ getSession: async ()=>null };');
      const out = join(dir,'generated');
      await buildProject({ srcDir: dir, outDir: out });
      const utils = readFileSync(join(out,'auth','authUtils.ts'),'utf8');
      expect(utils).toMatch(/generateToken/);
      expect(utils).toMatch(/verifyToken/);
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });
  test('token expiration code present', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'models.locus'),'database { entity User { id: Integer name: String } }');
      writeFileSync(join(dir,'Locus.toml'),'[auth]\nadapter="./authAdapter.js"\njwtSecret="DEVSECRET"');
      writeFileSync(join(dir,'authAdapter.js'),'module.exports={ getSession: async ()=>null };');
      const out = join(dir,'generated');
      await buildProject({ srcDir: dir, outDir: out });
      const utils = readFileSync(join(out,'auth','authUtils.ts'),'utf8');
      expect(utils).toMatch(/expSeconds/);
      expect(utils).toMatch(/obj.exp/);
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });
});
