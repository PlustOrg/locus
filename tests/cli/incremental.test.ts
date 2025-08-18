import { createIncrementalBuilder } from '../../src/cli/incremental';

describe('Incremental builder', () => {
  test('init, update, remove flows write expected outputs', async () => {
    const files: Record<string, string> = {};
    const writes: Array<{ path: string; content: string }> = [];
    jest.spyOn(require('fs'), 'readFileSync').mockImplementation((...args: any[]) => {
      return files[args[0] as string];
    });
    jest.spyOn(require('fs'), 'existsSync').mockImplementation(() => true);
    jest.spyOn(require('fs'), 'mkdirSync').mockImplementation(() => undefined as any);
    jest.spyOn(require('fs'), 'writeFileSync').mockImplementation((...args: any[]) => {
      const p = args[0] as string; const c = args[1];
      writes.push({ path: p, content: String(c) });
    });

    const outDir = '/out';
    const inc = createIncrementalBuilder({ srcDir: '/src', outDir });

    // Add one file with an entity
    files['/src/a.locus'] = `database { entity User { id: Integer } }`;
    await inc.init(['/src/a.locus']);
    // Expect prisma schema and express route to be written
    expect(writes.some(w => w.path.endsWith('/out/prisma/schema.prisma'))).toBe(true);
    expect(writes.some(w => w.path.endsWith('/out/routes/user.ts'))).toBe(true);

    // Update: add a page definition in another file
    files['/src/b.locus'] = `page Home { state { greeting: String = "Hello" } ui { <div>{greeting}</div> } }`;
    await inc.update('/src/b.locus');
    expect(writes.some(w => w.path.endsWith('/out/react/pages/Home.tsx'))).toBe(true);

    // Remove: delete entity file and rebuild
    await inc.remove('/src/a.locus');
    const latestSchema = [...writes].reverse().find(w => w.path.endsWith('/out/prisma/schema.prisma'))!;
    expect(latestSchema.content).not.toMatch(/model\s+User\b/);
  });

  test('update with invalid source reports BuildError', async () => {
    const files: Record<string, string> = {};
  jest.spyOn(require('fs'), 'readFileSync').mockImplementation((...args: any[]) => files[args[0] as string]);
    jest.spyOn(require('fs'), 'existsSync').mockImplementation(() => true);
    jest.spyOn(require('fs'), 'mkdirSync').mockImplementation(() => undefined as any);
    jest.spyOn(require('fs'), 'writeFileSync').mockImplementation(() => undefined as any);
    const inc = createIncrementalBuilder({ srcDir: '/src', outDir: '/out' });

    // invalid content to trigger parser error
    files['/src/bad.locus'] = `database { entity { } }`;
    await expect(inc.update('/src/bad.locus')).rejects.toThrow(/Failed to parse/);
  });
});
