import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildProject } from '../../src/cli/build';

function tdir(){ return mkdtempSync(join(tmpdir(), 'locus-plugin-gen-')); }

describe('Plugin custom generator', () => {
  test('registerGenerator outputs artifacts with conflict detection warning', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'app.locus'),'component Root { ui { <div/> } }');
      writeFileSync(join(dir,'locus.plugins.js'), `module.exports=[{
        name:'genPlugin', apiVersion:1,
        onBeforeGenerate(u,ctx){
          ctx.registerGenerator('extra', (uast)=>({ 'extra/hello.txt':'hi', 'extra/conflict.txt':'A'}));
          ctx.registerGenerator('extra2', (uast)=>({ 'extra/conflict.txt':'B'}));
        }
      }];`);
      const out = join(dir,'generated');
      const res = await buildProject({ srcDir: dir, outDir: out });
      expect(existsSync(join(out,'extra/hello.txt'))).toBe(true);
      const conflict = readFileSync(join(out,'extra/conflict.txt'),'utf8');
      expect(conflict).toBe('A');
  expect(res.meta.warnings.some((_w:string)=>/conflict/i)).toBe(true);
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });
});
