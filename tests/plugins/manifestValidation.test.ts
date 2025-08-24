import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { doctorPlugins } from '../../src/cli/plugins';

function tdir(){ return mkdtempSync(join(tmpdir(), 'locus-plugin-manifest-')); }

describe('Plugin manifest validation & timeouts', () => {
  test('invalid apiVersion produces warning', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'app.locus'),'component R { ui { <div/> } }');
      writeFileSync(join(dir,'locus.plugins.js'), `module.exports=[{name:'bad', apiVersion:999}];`);
      const rep = await doctorPlugins(dir);
  expect(rep.warnings.some(_w=>/apiVersion/i)).toBe(true);
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });

  test('hook timeout produces warning', async () => {
    const dir = tdir();
    try {
      writeFileSync(join(dir,'app.locus'),'component R { ui { <div/> } }');
      writeFileSync(join(dir,'locus.plugins.js'), `module.exports=[{name:'slow', apiVersion:1, onBeforeGenerate(){ return new Promise(r=>setTimeout(r, 60)); }}];`);
      process.env.LOCUS_PLUGIN_TIMEOUT_MS = '25';
      const rep = await doctorPlugins(dir);
  expect(rep.warnings.some(_w=>/timeout/i)).toBe(true);
    } finally { delete process.env.LOCUS_PLUGIN_TIMEOUT_MS; rmSync(dir,{recursive:true,force:true}); }
  });
});
