import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, readdirSync, readFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Transpile-only style check: ensure generated TS contains expected component exports.

test('React/Next TS generation smoke', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'locus-ts-smoke-'));
  const src = join(dir, 'src');
  mkdirSync(src, { recursive: true });
  writeFileSync(join(src, 'ui.locus'), `page Home { } page About { }`);
  await buildProject({ srcDir: src, outDir: join(src, 'generated') });
  const pagesDir = join(src, 'generated', 'react', 'pages');
  const files = readdirSync(pagesDir);
  expect(files).toEqual(expect.arrayContaining(['Home.tsx', 'About.tsx']));
  const nextLanding = readFileSync(join(src, 'generated', 'next-app', 'app', 'page.tsx'), 'utf8');
  expect(nextLanding).toContain('Locus Pages');
});
