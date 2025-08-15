import { buildProject } from '../../src/cli/build';
import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

jest.mock('../../src/parser', () => ({ parseLocus: jest.fn() }));
jest.mock('../../src/parser/merger', () => ({ mergeAsts: jest.fn() }));

const mockFs: Record<string, string> = {};
jest.mock('fs', () => ({
  writeFileSync: (p: string, c: string) => { mockFs[p] = c; },
  mkdirSync: () => {},
  existsSync: () => false,
  readdirSync: () => ['a.locus', 'b.locus'],
}));

jest.mock('path', () => ({ join: (...parts: string[]) => parts.join('/') }));

import * as parser from '../../src/parser';
import * as merger from '../../src/parser/merger';

describe('CLI build command', () => {
  beforeEach(() => {
    (parser.parseLocus as any).mockReturnValue({ databases: [], designSystems: [], pages: [], components: [], stores: [] });
    (merger.mergeAsts as any).mockReturnValue({
      database: { entities: [] },
      pages: [{ name: 'Home', ui: 'ui { <div /> }', state: [], actions: [] }],
      components: [{ name: 'Card', params: [], ui: 'ui { <div /> }' }],
      stores: []
    });
    for (const k of Object.keys(mockFs)) delete mockFs[k];
  });

  test('build orchestrates parse -> merge -> write outputs', async () => {
    await buildProject({ srcDir: '/proj' } as any);
    expect(parser.parseLocus).toHaveBeenCalledTimes(2);
    expect(merger.mergeAsts).toHaveBeenCalled();
  // crude assertions that outputs were written
    const keys = Object.keys(mockFs);
    expect(keys.some(k => k.includes('schema.prisma'))).toBe(true);
  expect(keys.some(k => k.includes('/react/pages/Home.tsx'))).toBe(true);
  expect(keys.some(k => k.includes('/react/components/Card.tsx'))).toBe(true);
  });
});
