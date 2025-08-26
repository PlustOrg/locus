import { dev } from '../../src/cli/dev';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import chalk from 'chalk';

jest.mock('../../src/cli/build', () => ({ buildProject: jest.fn().mockResolvedValue({ meta: { hasPages: false } }) }));

// Custom chokidar mock capturing change handler
let changeHandler: ((rel: string)=>void)|null = null;
jest.mock('chokidar', () => ({
  watch: () => ({
    on: (evt: string, cb: any) => { if (evt === 'change') changeHandler = cb; },
    close: () => {}
  })
}), { virtual: true });

describe('dev debug timing', () => {
  const realLog = console.log;
  const realErr = process.stderr.write;
  let out = '';
  let err = '';
  beforeEach(() => {
    out = '';
    err = '';
    console.log = (...args: any[]) => { out += args.join(' ') + '\n'; };
    process.stderr.write = (chunk: any) => { err += String(chunk); return true; };
    chalk.level = 0;
  });
  afterEach(() => {
    console.log = realLog;
    process.stderr.write = realErr;
    chalk.level = 1;
  });

  test('LOCUS_DEBUG timing output present after change', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'locus-dev-debug-'));
    const file = join(dir, 'file.locus');
    writeFileSync(file, '');
    process.env.LOCUS_DEBUG = '1';
    process.env.LOCUS_TEST_DISABLE_SPAWN = '1';
    const { shutdown } = await dev({ srcDir: dir, debug: true });
    expect(changeHandler).not.toBeNull();
    writeFileSync(file, 'updated');
    if (changeHandler) changeHandler('file.locus');
    // Debounce means we need to wait briefly for the change to be processed
    await new Promise(r => setTimeout(r, 150));
    expect(out).toContain('[locus][dev][change]');
    delete process.env.LOCUS_DEBUG;
    shutdown();
  });
});
