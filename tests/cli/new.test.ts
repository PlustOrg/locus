import { newProject } from '../../src/cli/new';

const mockFs: Record<string, string> = {};
jest.mock('fs', () => ({
  existsSync: (p: string) => p in mockFs || p.endsWith('/proj') || p === '/proj',
  mkdirSync: (p: string) => { mockFs[p] = '__dir__'; },
  writeFileSync: (p: string, c: string) => { mockFs[p] = c; },
}));
jest.mock('path', () => ({ join: (...parts: string[]) => parts.join('/'), resolve: (...p: string[]) => p.join('/') }));

describe('CLI new command', () => {
  beforeEach(() => { for (const k of Object.keys(mockFs)) delete mockFs[k]; mockFs['/proj'] = '__dir__'; });
  test('creates basic files including Locus.toml', () => {
    const res = newProject({ cwd: '/proj', name: 'app' });
    expect(res.root).toBe('/proj/app');
    expect(Object.keys(mockFs)).toEqual(expect.arrayContaining(['/proj/app/Locus.toml', '/proj/app/database.locus', '/proj/app/app.locus', '/proj/app/theme.locus']));
  });
});
