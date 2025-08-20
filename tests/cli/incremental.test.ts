import { createIncrementalBuilder } from '../../src/cli/incremental';
import * as fs from 'fs';

jest.mock('fs', () => ({
  __esModule: true,
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

beforeEach(() => {
  jest.restoreAllMocks();
});

describe('Incremental builder', () => {
  test('init, update, remove flows write expected outputs', async () => {
    const files: Record<string, string> = {};
    const writes: Array<{ path: string; content: string }> = [];
  (fs.readFileSync as unknown as jest.Mock).mockImplementation((...args: any[]) => {
      return files[args[0] as string];
    });
  (fs.existsSync as unknown as jest.Mock).mockImplementation(() => true);
  (fs.mkdirSync as unknown as jest.Mock).mockImplementation(() => undefined as any);
  (fs.writeFileSync as unknown as jest.Mock).mockImplementation((...args: any[]) => {
      const p = args[0] as string; const c = args[1];
      writes.push({ path: p, content: String(c) });
    });

    const outDir = '/out';
    const inc = createIncrementalBuilder({ srcDir: '/src', outDir, fileMap: new Map() });

    // Add one file with an entity
    files['/src/a.locus'] = `database { entity User { id: Integer } }`;
    await inc.init(['/src/a.locus']);
    // Expect prisma schema and express route to be written
  const norm = (s: string) => s.replace(/\\/g, '/');
  expect(writes.some(w => norm(w.path).endsWith('/out/prisma/schema.prisma'))).toBe(true);
  expect(writes.some(w => norm(w.path).endsWith('/out/routes/user.ts'))).toBe(true);

    // Update: add a page definition in another file
    files['/src/b.locus'] = `page Home { state { greeting: String = "Hello" } ui { <div>{greeting}</div> } }`;
    await inc.update('/src/b.locus');
  expect(writes.some(w => norm(w.path).endsWith('/out/react/pages/Home.tsx'))).toBe(true);

    // Remove: delete entity file and rebuild
    await inc.remove('/src/a.locus');
  const latestSchema = [...writes].reverse().find(w => norm(w.path).endsWith('/out/prisma/schema.prisma'))!;
    expect(latestSchema.content).not.toMatch(/model\s+User\b/);
  });

  test('update with invalid source reports BuildError', async () => {
    const files: Record<string, string> = {};
  (fs.readFileSync as unknown as jest.Mock).mockImplementation((...args: any[]) => files[args[0] as string]);
    (fs.existsSync as unknown as jest.Mock).mockImplementation(() => true);
    (fs.mkdirSync as unknown as jest.Mock).mockImplementation(() => undefined as any);
  (fs.writeFileSync as unknown as jest.Mock).mockImplementation(() => undefined as any);
    const inc = createIncrementalBuilder({
      srcDir: '/src',
      outDir: '/out',
      fileMap: new Map(),
    });

    // invalid content to trigger parser error
    files['/src/bad.locus'] = `database { entity { } }`;
    await expect(inc.update('/src/bad.locus')).rejects.toThrow(
      /Expecting token of type --> Identifier <-- but found --> '{' <--/
    );
  });
});
