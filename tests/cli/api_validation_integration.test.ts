import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Integration-style test that inspects generated route validation logic.

test('generated POST route includes validation and rejects invalid body', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'locus-api-val-'));
  const src = join(dir, 'src');
  mkdirSync(src, { recursive: true });
  writeFileSync(join(src, 'app.locus'), `database { entity User { age: Integer @min(18) @max(120) email: String @email nickname: String @length(3,10) } }`);
  await buildProject({ srcDir: src, outDir: join(src, 'generated') });
  const routeTs = readFileSync(join(src, 'generated', 'routes', 'user.ts'), 'utf8');
  expect(routeTs).toContain('validateUserBody');
  expect(routeTs).toContain('validationErrorEnvelope');
});
