import { buildProject } from '../../src/cli/build';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'locus-e2e-'));
}

describe('E2E build (real files)', () => {
  test('parses .locus files and writes outputs', async () => {
    const dir = tmpdir();
    const srcDir = path.join(dir, 'src');
    fs.mkdirSync(srcDir);
  const locusA = `// minimal locus\ndatabase { entity X { name: String } }`;
  const locusB = `// another file with a different entity\ndatabase { entity Y { label: String } }`;
  fs.writeFileSync(path.join(srcDir, 'a.locus'), locusA);
    fs.mkdirSync(path.join(srcDir, 'nested'));
  fs.writeFileSync(path.join(srcDir, 'nested', 'b.locus'), locusB);

    const outDir = path.join(dir, 'out');
    await buildProject({ srcDir, outDir });

    const prismaPath = path.join(outDir, 'prisma', 'schema.prisma');
    expect(fs.existsSync(prismaPath)).toBe(true);
    const schema = fs.readFileSync(prismaPath, 'utf8');
  expect(schema).toContain('model X');
  expect(schema).toContain('model Y');

    // Express routes
    const routesDir = path.join(outDir, 'routes');
    const files = fs.readdirSync(routesDir);
    expect(files.length).toBeGreaterThan(0);
  });
});
