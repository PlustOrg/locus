import { dev } from '../../src/cli/dev';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

jest.mock('../../src/cli/build', () => ({ buildProject: jest.fn().mockResolvedValue({ meta: { hasPages: false } }) }));
jest.mock('chokidar', () => ({ watch: () => ({ on: () => {}, close: () => {} }) }), { virtual: true });

test('--quiet suppresses banner', async () => {
  const realWrite = process.stdout.write;
  let out = '';
  (process.stdout.write as any) = (c: any) => { out += String(c); return true; };
  const dir = mkdtempSync(join(tmpdir(), 'locus-dev-quiet-'));
  process.env.LOCUS_TEST_DISABLE_SPAWN = '1';
  writeFileSync(join(dir, 'a.locus'), '');
  await dev({ srcDir: dir, quiet: true });
  expect(out).not.toMatch(/App:/);
  (process.stdout.write as any) = realWrite;
});
