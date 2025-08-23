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

describe('Incremental remove deletes outputs (schema no longer has model)', () => {
  test('remove file updates generated schema', async () => {
    const files: Record<string, string> = {};
    const writes: Array<{ path: string; content: string }> = [];
    (fs.readFileSync as unknown as jest.Mock).mockImplementation((p: string) => files[p]);
    (fs.existsSync as unknown as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as unknown as jest.Mock).mockImplementation(() => undefined);
    (fs.writeFileSync as unknown as jest.Mock).mockImplementation((p: string, c: string) => { writes.push({ path: p, content: c }); });

    files['/src/a.locus'] = 'database { entity User { id: Integer } }';
    files['/src/b.locus'] = 'database { entity Post { id: Integer } }';

    const inc = createIncrementalBuilder({ srcDir: '/src', outDir: '/out', fileMap: new Map() });
    await inc.init(['/src/a.locus', '/src/b.locus']);
    await inc.remove('/src/a.locus');

    const schemaWrites = writes.filter(w => w.path.endsWith('schema.prisma'));
    const latest = schemaWrites[schemaWrites.length - 1].content;
    expect(latest).not.toMatch(/model User/);
    expect(latest).toMatch(/model Post/);
  });
});
