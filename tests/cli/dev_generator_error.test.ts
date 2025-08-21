import { spawnSync } from 'child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

test('dev continues (exits with failure) on generator error with clear message', () => {
  const dir = mkdtempSync(join(tmpdir(), 'locus-dev-generr-'));
  const src = join(dir, 'src');
  mkdirSync(src, { recursive: true });
  writeFileSync(join(src, 'app.locus'), 'database { entity A { x: String } }');
  const result = spawnSync('node', [join(process.cwd(), 'dist/index.js'), 'build', '--src', src], {
    env: { ...process.env, LOCUS_TEST_FORCE_GENERATOR_ERROR: '1' },
    encoding: 'utf8'
  });
  expect(result.status).toBe(1);
  expect(result.stderr + result.stdout).toContain('Forced generator error');
});
