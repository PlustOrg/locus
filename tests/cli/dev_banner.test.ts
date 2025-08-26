import { dev } from '../../src/cli/dev';
import * as buildMod from '../../src/cli/build';
import { writeFileSync, mkdtempSync } from 'fs';
import chalk from 'chalk';
import { tmpdir } from 'os';
import { join } from 'path';

jest.mock('../../src/cli/build', () => ({ buildProject: jest.fn() }));
jest.mock('chokidar', () => ({ watch: () => ({ on: () => {}, close: () => {} }) }), { virtual: true });

describe('dev banner', () => {
  const realLog = console.log;
  let output = '';
  beforeEach(() => {
    output = '';
    process.env.LOCUS_TEST_DISABLE_SPAWN = '1';
    (buildMod as any).buildProject.mockResolvedValue({ meta: { hasPages: true } });
    console.log = (chunk: any) => { output += chunk + '\n'; };
    chalk.level = 0;
  });
  afterEach(() => {
    console.log = realLog;
    chalk.level = 1;
  });

  test('includes web section when pages present', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'locus-dev-banner-'));
    writeFileSync(join(dir, 'sample.locus'), 'page Home { }');
    const { shutdown } = await dev({ srcDir: dir });
    expect(output).toContain('Web:');
    shutdown();
  });

  test('omits web section when no pages', async () => {
    (buildMod as any).buildProject.mockResolvedValueOnce({ meta: { hasPages: false } });
    const dir = mkdtempSync(join(tmpdir(), 'locus-dev-banner2-'));
    writeFileSync(join(dir, 'sample.locus'), '');
    const { shutdown } = await dev({ srcDir: dir });
    expect(output).not.toContain('Web:');
    shutdown();
  });

  test('shows prisma hint when client missing', async () => {
    (buildMod as any).buildProject.mockResolvedValueOnce({ meta: { hasPages: false } });
    const dir = mkdtempSync(join(tmpdir(), 'locus-dev-banner3-'));
    writeFileSync(join(dir, 'sample.locus'), '');
    const origResolve = require.resolve;
    // force require.resolve('@prisma/client') to throw
    (require as any).resolve = (id: string) => {
      if (id === '@prisma/client') throw new Error('not found');
      return origResolve(id);
    };
    const { shutdown } = await dev({ srcDir: dir });
    expect(output).toContain('Prisma:');
    expect(output).toContain('run prisma generate');
    (require as any).resolve = origResolve;
    shutdown();
  });
});
