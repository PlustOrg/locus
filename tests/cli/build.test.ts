import { buildProject } from '../../src/cli/build';
import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import * as fs from 'fs';
import * as parser from '../../src/parser';
import * as merger from '../../src/parser/merger';

jest.mock('../../src/parser', () => ({ parseLocus: jest.fn() }));
jest.mock('../../src/parser/merger', () => ({ mergeAsts: jest.fn() }));

jest.mock('fs', () => ({
  __esModule: true,
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const mockFs: Record<string, string> = {};

describe('CLI build command', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
  beforeEach(() => {
    (parser.parseLocus as any).mockReturnValue({ databases: [], designSystems: [], pages: [], components: [], stores: [] });
    (merger.mergeAsts as any).mockReturnValue({
      database: { entities: [] },
      pages: [{ name: 'Home', ui: 'ui { <div /> }', state: [], actions: [] }],
      components: [{ name: 'Card', params: [], ui: 'ui { <div /> }' }],
      stores: []
    });
    for (const k of Object.keys(mockFs)) delete mockFs[k];
  (fs.readdirSync as unknown as jest.Mock).mockReturnValue(['a.locus', 'b.locus']);
  (fs.readFileSync as unknown as jest.Mock).mockReturnValue('// sample');
  (fs.mkdirSync as unknown as jest.Mock).mockImplementation(() => undefined as any);
  (fs.existsSync as unknown as jest.Mock).mockReturnValue(false);
  (fs.writeFileSync as unknown as jest.Mock).mockImplementation((p: any, c: any) => { mockFs[String(p)] = String(c); });
  });

  test('build orchestrates parse -> merge -> write outputs', async () => {
    await buildProject({ srcDir: '/proj' } as any);
    expect(parser.parseLocus).toHaveBeenCalledTimes(2);
    expect(merger.mergeAsts).toHaveBeenCalled();
    // crude assertions that outputs were written
    const keys = Object.keys(mockFs);
    const norm = (s: string) => s.replace(/\\/g, '/');
    expect(keys.some(k => norm(k).includes('schema.prisma'))).toBe(true);
    expect(keys.some(k => norm(k).includes('/react/pages/Home.tsx'))).toBe(true);
    expect(keys.some(k => norm(k).includes('/react/components/Card.tsx'))).toBe(true);
  });
});
