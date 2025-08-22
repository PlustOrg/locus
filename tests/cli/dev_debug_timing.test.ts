import { dev } from '../../src/cli/dev';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

jest.mock('../../src/cli/build', () => ({ buildProject: jest.fn().mockResolvedValue({ meta: { hasPages: false } }) }));

// Custom chokidar mock capturing change handler
let changeHandler: ((rel: string)=>void)|null = null;
jest.mock('chokidar', () => ({
  watch: () => ({
    on: (evt: string, cb: any) => { if (evt === 'change') changeHandler = cb; },
    close: () => {}
  })
}), { virtual: true });

test('LOCUS_DEBUG timing output present after change', async () => {
  const realWrite = process.stdout.write;
  let out = '';
  (process.stdout.write as any) = (c: any) => { out += String(c); return true; };
  const dir = mkdtempSync(join(tmpdir(), 'locus-dev-debug-'));
  const file = join(dir, 'file.locus');
  writeFileSync(file, '');
  process.env.LOCUS_DEBUG = '1';
  process.env.LOCUS_TEST_DISABLE_SPAWN = '1';
  await dev({ srcDir: dir });
  expect(changeHandler).not.toBeNull();
  writeFileSync(file, 'updated');
  if (changeHandler) changeHandler('file.locus');
  expect(out).toMatch(/\[locus\]\[dev\]\[timing] batch=\d+ total=\d+ dt=\d+ms/);
  delete process.env.LOCUS_DEBUG;
  (process.stdout.write as any) = realWrite;
});
