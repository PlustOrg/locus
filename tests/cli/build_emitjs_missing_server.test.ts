import { buildProject } from '../../src/cli/build';
import * as fs from 'fs';
import * as parser from '../../src/parser';
import * as merger from '../../src/parser/merger';

jest.mock('../../src/parser', () => ({ parseLocus: jest.fn() }));
jest.mock('../../src/parser/merger', () => ({ mergeAsts: jest.fn() }));

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  const mock: any = { __esModule: true, ...actual, readdirSync: jest.fn(), readFileSync: jest.fn(), existsSync: jest.fn(), writeFileSync: jest.fn(), mkdirSync: jest.fn() };
  mock.promises = { ...actual.promises, writeFile: jest.fn(), mkdir: jest.fn() };
  return mock;
});

describe('build emitJs without server.ts presence does not crash', () => {
  beforeEach(() => {
    (parser.parseLocus as any).mockReturnValue({ databases: [], designSystems: [], pages: [], components: [], stores: [] });
    (merger.mergeAsts as any).mockReturnValue({ database: { entities: [] }, pages: [], components: [], stores: [] });
    (fs.readdirSync as any).mockReturnValue(['a.locus']);
    (fs.readFileSync as any).mockReturnValue('// sample');
    (fs.existsSync as any).mockReturnValue(false);
  });
  test('runs successfully', async () => {
    const res = await buildProject({ srcDir: '/proj', outDir: '/out', emitJs: true } as any);
    expect(res.meta.hasPages).toBe(false);
  });
});
