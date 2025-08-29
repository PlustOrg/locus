import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('workflow:run CLI', () => {
  const proj = path.resolve(__dirname, '../..');
  test('dry-run success', () => {
    const wfPath = path.join(proj, 'temp_workflow_cli.locus');
    fs.writeFileSync(wfPath, `workflow Demo { trigger { t } steps { run doThing(x) } }`);
    try {
      const out = execSync(`node dist/index.js workflow:run Demo --src ${proj} --dry-run`, { cwd: proj, env: { ...process.env, LOCUS_TEST_DISABLE_SPAWN: '1' } }).toString();
      expect(out).toMatch(/validated successfully/);
    } finally { try { fs.unlinkSync(wfPath); } catch {} }
  });
  test('invalid name exits', () => {
  let code = 0;
  try { execSync(`node dist/index.js workflow:run __Nope__ --src ${proj}`, { cwd: proj, env: { ...process.env, LOCUS_TEST_DISABLE_SPAWN: '1' } }).toString(); }
  catch(e:any) { code = e.status; }
    expect(code).not.toBe(0);
  });
});
