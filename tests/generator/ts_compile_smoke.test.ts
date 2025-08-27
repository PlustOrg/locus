import { buildProject } from '../../src/cli/build';
import { mkdtempSync, writeFileSync, readdirSync, readFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';

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

// This is a more thorough test that actually runs TSC on the output.
test('Generated page with runtime components should be valid TSX', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'locus-ts-compile-smoke-'));
  const srcDir = join(dir, 'src');
  mkdirSync(srcDir, { recursive: true });

  // Use some built-in components to ensure they are imported and compiled.
  const locusFile = `
    page TestPage {
      ui {
        <Stack gap="1rem">
          <Text variant="heading">Welcome</Text>
          <Input placeholder="Enter your name" />
          <Button variant="primary">Submit</Button>
        </Stack>
      }
    }
  `;
  writeFileSync(join(srcDir, 'ui.locus'), locusFile);

  const outDir = join(dir, 'generated');
  await buildProject({ srcDir, outDir });

  // The build process should have created the runtime files and the page.
  // Now, we'll try to compile the generated React code.
  const reactDir = join(outDir, 'react');

  const tsconfig = {
    compilerOptions: {
      target: 'es2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      jsx: 'react-jsx',
      strict: true,
      noEmit: true, // We only want to type-check, not produce JS files.
      esModuleInterop: true,
      moduleResolution: 'node',
      // The runtime components are inside this dir, so relative paths should resolve.
    },
    include: ['**/*.ts', '**/*.tsx'],
  };
  writeFileSync(join(reactDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  // To satisfy the TSC, we need `react` and `@types/react`.
  // The most reliable way is to create a minimal package.json and run npm install.
  const packageJson = {
    name: 'locus-compile-test',
    private: true,
    dependencies: {
      react: '^18.0.0', // Match version used in runtime components
    },
    devDependencies: {
      '@types/react': '^18.0.0',
      typescript: '^5.0.0',
    },
  };
  writeFileSync(join(reactDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  try {
    // Use npx, which is generally available in CI environments.
    // The --silent flag reduces log noise.
    execSync('npm install --silent', { cwd: reactDir, stdio: 'ignore' });
    execSync('npx tsc --project tsconfig.json', { cwd: reactDir, stdio: 'pipe' });
    // If tsc completes without throwing, the test is considered passed.
  } catch (e: any) {
    // If tsc fails, its error output will be in e.stdout.
    // We fail the test and print the output for debugging.
    throw new Error(`TSC compilation failed for generated code:\n${e.stdout?.toString()}`);
  }
}, 30000); // Increase timeout to allow for npm install
