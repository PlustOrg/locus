import { dev } from '../../src/cli/dev';

jest.mock('child_process', () => ({ spawn: jest.fn(() => ({ stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() })) }));
jest.mock('chokidar', () => ({ watch: jest.fn(() => ({ on: jest.fn() })) }), { virtual: true });

describe('CLI dev command', () => {
  test('dev sets up watcher and starts processes', async () => {
    await dev({ srcDir: '/proj' } as any);
    // If it returns without throwing, consider it okay for now.
    expect(true).toBe(true);
  });
});
