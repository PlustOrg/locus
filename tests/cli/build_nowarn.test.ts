import { buildProject } from '../../src/cli/build';
import * as fs from 'fs';
import * as parser from '../../src/parser';
import * as merger from '../../src/parser/merger';

jest.mock('../../src/parser', () => ({ parseLocus: jest.fn() }));
jest.mock('../../src/parser/merger', () => ({ mergeAsts: jest.fn() }));

const mockFs: Record<string,string> = {};
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  const mock: any = {
    __esModule: true,
    ...actual,
    writeFileSync: jest.fn((p: string, c: string) => { mockFs[p]=c; }),
    mkdirSync: jest.fn(),
    existsSync: jest.fn(),
    readdirSync: jest.fn(),
    readFileSync: jest.fn(),
  };
  mock.promises = { ...actual.promises, writeFile: jest.fn(async (p: string, c: string)=>{ mockFs[p]=String(c); }), mkdir: jest.fn() };
  return mock;
});

describe('build --no-warn suppresses warnings artifact and output', () => {
  // mockFs defined above
  let consoleOutput = '';
  const origLog = console.log;
  beforeEach(() => {
    consoleOutput = '';
    console.log = (chunk: any) => { consoleOutput += chunk + '\n'; };
  (parser.parseLocus as any).mockReturnValue({ databases: [], designSystems: [], pages: [], components: [{ name: 'Card', params: [], ui: 'ui { <div>{children}</div> }', styleOverride: '.x { }' }], stores: [] });
  (merger.mergeAsts as any).mockReturnValue({ database: { entities: [] }, pages: [], components: [{ name: 'Card', styleOverride: '.x { }', params: [], ui: 'ui { <div>{children}</div> }' }], stores: [] });
    (fs.readdirSync as any).mockReturnValue(['a.locus']);
  (fs.readFileSync as any).mockReturnValue('component Card { ui { <div>{children}</div> } style:override { .x { } } }');
    (fs.writeFileSync as any).mockImplementation((p: string, c: string) => { mockFs[p]=c; });
    (fs.existsSync as any).mockReturnValue(false);
    (fs.mkdirSync as any).mockImplementation(()=>{});
  });
  afterEach(()=>{ console.log = origLog; });
  test('warnings file present when not suppressed', async () => {
    await buildProject({ srcDir: '/proj', outDir: '/out', emitJs: false, suppressWarnings: false } as any);
    const keys = Object.keys(mockFs);
    expect(keys.some(k=>k.includes('GENERATED_WARNINGS.txt'))).toBe(true);
    expect(consoleOutput).toMatch(/!/);
  });
  test('warnings file absent and no stdout warn with suppressWarnings', async () => {
    Object.keys(mockFs).forEach(k=>delete mockFs[k]);
    await buildProject({ srcDir: '/proj', outDir: '/out', emitJs: false, suppressWarnings: true } as any);
    const keys = Object.keys(mockFs);
    expect(keys.some(k=>k.includes('GENERATED_WARNINGS.txt'))).toBe(false);
    expect(consoleOutput).not.toContain('!');
  });
});
