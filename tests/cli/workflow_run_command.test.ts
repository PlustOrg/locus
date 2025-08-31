import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('workflow:run CLI', () => {
  const proj = path.resolve(__dirname, '../..'); // still used for invalid name case
  test('dry-run success', () => {
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'tmp-wf-run-'));
    const wfPath = path.join(tempDir, 'demo.locus');
  fs.writeFileSync(wfPath, `page P { action doThing() {} }\nworkflow Demo { trigger { t } steps { run doThing() } }`);
    const out = execSync(`node ${path.join(__dirname,'../../dist/index.js')} workflow:run Demo --src ${tempDir} --dry-run`, { env: { ...process.env, LOCUS_TEST_DISABLE_SPAWN: '1' } }).toString();
    expect(out).toMatch(/validated successfully/);
  });
  test('invalid name exits', () => {
  let code = 0;
  try { execSync(`node dist/index.js workflow:run __Nope__ --src ${proj}`, { cwd: proj, env: { ...process.env, LOCUS_TEST_DISABLE_SPAWN: '1' } }).toString(); }
  catch(e:any) { code = e.status; }
    expect(code).not.toBe(0);
  });
});
