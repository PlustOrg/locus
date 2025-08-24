import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { listPlugins, doctorPlugins } from '../../src/cli/plugins';

function tdir(){ return mkdtempSync(join(tmpdir(), 'locus-plugin-modres-')); }

describe('Plugin module resolution & caching', () => {
  test('string module entries resolved from node_modules', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'app.locus'),'component X { ui { <div/> } }');
  const pluginDir = join(dir,'node_modules','my-plugin');
  mkdirSync(pluginDir, { recursive: true });
      writeFileSync(join(pluginDir,'index.js'), 'module.exports={ name:"my-plugin", apiVersion:1 };');
      writeFileSync(join(dir,'locus.plugins.js'),'module.exports=["my-plugin"];');
      const names = await listPlugins(dir);
      expect(names).toContain('my-plugin');
    } finally { rmSync(dir,{recursive:true, force:true}); }
  });

  test('doctor lists hooks implemented', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'app.locus'),'component Y { ui { <div/> } }');
      writeFileSync(join(dir,'locus.plugins.js'),'module.exports=[{name:"h", apiVersion:1, onBeforeGenerate(){}}];');
  const rep: any = await doctorPlugins(dir);
  expect(rep.hookSummary).toBeDefined();
  expect(rep.hookSummary.find((h:any)=>h.name==='h').hooks).toContain('onBeforeGenerate');
    } finally { rmSync(dir,{recursive:true, force:true}); }
  });
});
