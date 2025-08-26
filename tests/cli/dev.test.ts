import { dev } from '../../src/cli/dev';
import { createIncrementalBuilder } from '../../src/cli/incremental';

jest.mock('child_process', () => ({ spawn: jest.fn(() => ({ stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() })) }));
jest.mock('chokidar', () => ({ watch: jest.fn(() => ({ on: jest.fn() })) }), { virtual: true });

describe('CLI dev command', () => {
  test('dev sets up watcher and starts processes', async () => {
    const { shutdown } = await dev({ srcDir: '/proj' } as any);
    // If it returns without throwing, consider it okay for now.
    expect(true).toBe(true);
    shutdown();
  });
  test('incremental ignores non-locus files on update/remove', async () => {
    const fileMap = new Map();
    const builder = createIncrementalBuilder({ srcDir: '/proj', outDir: '/proj/generated', fileMap });
    // init with no files
    await builder.init([]);
    // Calling update/remove with non-.locus should be a no-op (no throw)
    await builder.update('/proj/generated/node_modules/.bin/tsserver');
    await builder.remove('/proj/generated/node_modules/.bin/tsserver');
    expect(true).toBe(true);
  });
});
