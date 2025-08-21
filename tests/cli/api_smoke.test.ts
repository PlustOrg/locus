import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Smoke test skeleton: ensures server & route generate correctly.
// (Does not fully execute server due to TS runtime constraints inside test env.)

test('API smoke: server & route generated', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'locus-api-smoke-'));
  const src = join(dir, 'src');
  mkdirSync(src, { recursive: true });
  // Minimal database block with one entity
  writeFileSync(join(src, 'app.locus'), `database { entity User { name: String } }`);
  await buildProject({ srcDir: src, outDir: join(src, 'generated') });
  const serverTs = readFileSync(join(src, 'generated', 'server.ts'), 'utf8');
  expect(serverTs).toContain('startServer');
  const routeTs = readFileSync(join(src, 'generated', 'routes', 'user.ts'), 'utf8');
  expect(routeTs).toContain("router.get('/user', async");
});
