import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { listPlugins, doctorPlugins } from '../../src/cli/plugins';

function temp() { return mkdtempSync(join(tmpdir(), 'locus-plugin-cmd-')); }

describe('plugins CLI helpers', () => {
  test('listPlugins returns loaded plugin names', async () => {
    const dir = temp();
    try {
      writeFileSync(join(dir, 'app.locus'), 'component X { ui { <div/> } }');
      writeFileSync(join(dir, 'locus.plugins.js'), "module.exports=[{name:'p1'},{name:'p2'}];");
      const names = await listPlugins(dir);
      expect(names.sort()).toEqual(['p1','p2']);
    } finally { rmSync(dir, {recursive:true, force:true}); }
  });

  test('doctorPlugins returns warnings array (empty ok)', async () => {
    const dir = temp();
    try {
      writeFileSync(join(dir, 'app.locus'), 'component X { ui { <div/> } }');
      writeFileSync(join(dir, 'locus.plugins.js'), "module.exports=[{name:'docPlugin', onBeforeGenerate(){}}];");
      const report = await doctorPlugins(dir);
  expect(report.plugins.map((p: any)=>p.name)).toContain('docPlugin');
  expect(Array.isArray(report.warnings)).toBe(true);
  expect(report.timings).toBeDefined();
    } finally { rmSync(dir, {recursive:true, force:true}); }
  });
});
