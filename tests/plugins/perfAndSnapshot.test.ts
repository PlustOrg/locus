import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildProject } from '../../src/cli/build';

function tdir(){ return mkdtempSync(join(tmpdir(), 'locus-plugin-perf-')); }

describe('Plugin performance guard & snapshot', () => {
  test('slow hook triggers performance warning', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'app.locus'),'component P { ui { <div/> } }');
      writeFileSync(join(dir,'locus.plugins.js'), `module.exports=[{name:'slowPerf', apiVersion:1, onAfterGenerate(){ const start=Date.now(); while(Date.now()-start<30){} }}];`);
      process.env.LOCUS_PLUGIN_HOOK_WARN_MS = '10';
      const out = join(dir,'generated');
      const res = await buildProject({ srcDir: dir, outDir: out });
  expect(res.meta.warnings.some((_w:string)=>/performance/i)).toBe(true);
    } finally { delete process.env.LOCUS_PLUGIN_HOOK_WARN_MS; rmSync(dir,{recursive:true,force:true}); }
  });

  test('custom generator output snapshot', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'app.locus'),'component S { ui { <div/> } }');
      writeFileSync(join(dir,'locus.plugins.js'), `module.exports=[{name:'snapGen', apiVersion:1, onBeforeGenerate(u,ctx){ ctx.registerGenerator('snap',(u)=>({'extra/hello.txt':'hello-world'})); }}];`);
      const out = join(dir,'generated');
      await buildProject({ srcDir: dir, outDir: out });
      const content = readFileSync(join(out,'extra/hello.txt'),'utf8');
      expect(content).toMatchSnapshot('plugin-extra-hello');
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });
});
