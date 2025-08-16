import { deploy } from '../../src/cli/deploy';

const mockFS: Record<string, string> = {} as any;
jest.mock('fs', () => ({ readFileSync: (p: string) => mockFS[p], writeFileSync: jest.fn(), readdirSync: jest.fn(() => []) }));
jest.mock('path', () => ({ join: (...p: string[]) => p.join('/'), basename: (p: string) => p.split('/').pop(), resolve: (...p: string[]) => p.join('/') }));
jest.mock('../../src/cli/build', () => ({ buildProject: jest.fn(async () => ({ outDir: '/proj/generated' })) }));

describe('CLI deploy command', () => {
  test('reads Locus.toml and returns target info', async () => {
    mockFS['/proj/Locus.toml'] = `[app]\nname = "MyApp"\n\n[deploy.production]\nplatform = "vercel"\nbackend_platform = "railway"\ndatabase_url = "env(PRODUCTION_DATABASE_URL)"\n`;
    process.env.PRODUCTION_DATABASE_URL = 'postgres://example';
    const info = await deploy({ cwd: '/proj', env: 'production' });
    expect(info).toEqual({ appName: 'MyApp', frontend: 'vercel', backend: 'railway', databaseUrl: 'postgres://example' });
  });
});
