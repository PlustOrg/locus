import { runDbMigrate, runDbStudio } from '../../src/cli/db';
import * as cp from 'child_process';

jest.mock('child_process');

describe('CLI db commands', () => {
  beforeEach(() => {
    (cp.exec as any).mockImplementation((cmd: string, cb: Function) => {
      cb(null, 'ok', '');
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('locus db migrate calls prisma migrate dev', async () => {
    await runDbMigrate({ cwd: '/proj' } as any);
    expect(cp.exec).toHaveBeenCalled();
    const cmd = (cp.exec as any).mock.calls[0][0];
    expect(cmd).toMatch(/prisma\s+migrate\s+dev/);
  });

  test('locus db studio calls prisma studio', async () => {
    await runDbStudio({ cwd: '/proj' } as any);
    expect(cp.exec).toHaveBeenCalled();
    const cmd = (cp.exec as any).mock.calls[0][0];
    expect(cmd).toMatch(/prisma\s+studio/);
  });
});
