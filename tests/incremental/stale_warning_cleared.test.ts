import * as fs from 'fs';
import { createIncrementalBuilder } from '../../src/cli/incremental';

jest.mock('fs', () => ({
  __esModule: true,
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('Incremental stale warning cleared when component fixed', () => {
  test('auto-added children warning removed after adding param', async () => {
    const files: Record<string, string> = {};
    const writes: Array<{ path: string; content: string }> = [];
    (fs.readFileSync as unknown as jest.Mock).mockImplementation((p: string) => files[p]);
    (fs.existsSync as unknown as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as unknown as jest.Mock).mockImplementation(() => undefined);
    (fs.writeFileSync as unknown as jest.Mock).mockImplementation((p: string, c: string) => { writes.push({ path: p, content: c }); });

    files['/src/c.locus'] = 'component C { ui { <div>{children}</div> } }';
    const inc = createIncrementalBuilder({ srcDir: '/src', outDir: '/out', fileMap: new Map() });
    await inc.init(['/src/c.locus']);

    // Modify to declare children param explicitly
    files['/src/c.locus'] = 'component C { param children: slot ui { <div>{children}</div> } }';
    await inc.update('/src/c.locus');

    const warningsFiles = writes.filter(w => w.path.endsWith('GENERATED_WARNINGS.txt'));
    const last = warningsFiles[warningsFiles.length - 1]?.content || '';
    expect(last).not.toMatch(/auto-added slot param/);
  });
});
