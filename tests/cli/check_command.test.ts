import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('CLI: check command', () => {
  const bin = path.join(__dirname, '../../dist/index.js');
  beforeAll(() => {
    // Always rebuild to capture latest CLI changes
    spawnSync('npx', ['tsc','-p', path.join(__dirname, '../../tsconfig.json')]);
  });
  test('succeeds on valid sample', () => {
    const tmp = fs.mkdtempSync(path.join(process.cwd(), 'tmp-check-good-'));
    fs.writeFileSync(path.join(tmp, 'good.locus'), 'database { entity Foo { name: String } }');
    const res = spawnSync('node', [bin, 'check', '--src', tmp], { encoding: 'utf8' });
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/Check succeeded/);
  });
  test('fails on invalid source', () => {
    const tmp = fs.mkdtempSync(path.join(process.cwd(), 'tmp-check-'));
    fs.writeFileSync(path.join(tmp, 'bad.locus'), 'entity');
    const res = spawnSync('node', [bin, 'check', '--src', tmp], { encoding: 'utf8' });
    expect(res.status).not.toBe(0);
    expect(res.stderr).toMatch(/Parse error|error/i);
  });
});
