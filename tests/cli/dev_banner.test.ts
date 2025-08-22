import { dev } from '../../src/cli/dev';
import * as buildMod from '../../src/cli/build';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

jest.mock('../../src/cli/build', () => ({ buildProject: jest.fn() }));
jest.mock('chokidar', () => ({ watch: () => ({ on: () => {}, close: () => {} }) }), { virtual: true });

describe('dev banner', () => {
  const realWrite = process.stdout.write;
  let output = '';
  beforeEach(() => {
    output = '';
  process.env.LOCUS_TEST_DISABLE_SPAWN = '1';
    (buildMod as any).buildProject.mockResolvedValue({ meta: { hasPages: true } });
    (process.stdout.write as any) = (chunk: any) => { output += String(chunk); return true; };
  });
  afterAll(() => { (process.stdout.write as any) = realWrite; });

  test('includes web section when pages present', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'locus-dev-banner-'));
    writeFileSync(join(dir, 'sample.locus'), 'page Home { }');
    await dev({ srcDir: dir });
    expect(output).toContain('Web:  http://localhost:3000');
  });

  test('omits web section when no pages', async () => {
    (buildMod as any).buildProject.mockResolvedValueOnce({ meta: { hasPages: false } });
    const dir = mkdtempSync(join(tmpdir(), 'locus-dev-banner2-'));
    writeFileSync(join(dir, 'sample.locus'), '');
    await dev({ srcDir: dir });
    expect(output).not.toContain('Web:  http://localhost:3000');
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
    await dev({ srcDir: dir });
    expect(output).toMatch(/Prisma: ✗ \(run prisma generate\)/);
    (require as any).resolve = origResolve;
  });
});
