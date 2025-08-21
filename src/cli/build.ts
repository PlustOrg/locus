import { readdirSync, writeFileSync, mkdirSync, existsSync, readFileSync, statSync } from 'fs';
import { spawnSync } from 'child_process';
import { promises as fsp } from 'fs';
import { join, dirname } from 'path';
import { parseLocus } from '../parser';
import { mergeAsts } from '../parser/merger';
import { validateUnifiedAst } from '../validator/validate';
// generation now centralized in generator/outputs
import { BuildError, GeneratorError, LocusError } from '../errors';
import { buildOutputArtifacts, buildPackageJson, buildGeneratedReadme, getAppName } from '../generator/outputs';
import { reportError, ErrorOutputFormat } from './reporter';
export async function buildProject(opts: { srcDir: string; outDir?: string; debug?: boolean; errorFormat?: ErrorOutputFormat; prismaGenerate?: boolean; dryRun?: boolean }) {
  const srcDir = opts.srcDir;
  const outDir = opts.outDir || join(srcDir, 'generated');
  const debug = !!opts.debug;
  const t0 = Date.now();

  let files: string[];
  try {
    files = findLocusFiles(srcDir);
  } catch (e) {
    throw new BuildError(`Failed to read source directory: ${srcDir}`, e);
  }
  const fileMap = new Map<string, string>();
  const tParse0 = Date.now();
  const asts = files.map(fp => {
    try {
      const content = typeof readFileSync === 'function' ? readFileSync(fp, 'utf8') : String(fp);
      fileMap.set(fp, content);
      return parseLocus(content as any, fp);
    } catch (e) {
      if (e instanceof LocusError || (e && (e as any).code)) {
        reportError((e as any) as LocusError, fileMap, opts.errorFormat);
        process.exit(1);
      }
      throw new BuildError(`Failed to parse ${fp}: ${(e as any)?.message || e}`, e);
    }
  });
  const tParse1 = Date.now();
  let merged;
  try {
    merged = mergeAsts(asts);
  } catch (e) {
    if (e instanceof LocusError || (e && (e as any).code)) {
      reportError((e as any) as LocusError, fileMap, opts.errorFormat);
      process.exit(1);
    }
    throw new BuildError(`Failed to merge ASTs: ${(e as any)?.message || e}`, e);
  }
  // Validate unified AST
  try {
    validateUnifiedAst(merged);
  } catch (e) {
    if (e instanceof LocusError || (e && (e as any).code)) {
      reportError((e as any) as LocusError, fileMap, opts.errorFormat);
      process.exit(1);
    }
    throw e;
  }
  const tMerge1 = Date.now();

  // Generate artifacts using shared module
  try {
    const { files: artifacts, meta } = buildOutputArtifacts(merged, { srcDir });
    if (opts.dryRun) {
      const list = Object.keys(artifacts).sort();
      process.stdout.write('[locus][build][dry-run] files that would be written:\n' + list.map(f => ' - ' + f).join('\n') + '\n');
      return { outDir, dryRun: true, filesPlanned: list } as any;
    }
    const entries = Object.entries(artifacts).sort(([a], [b]) => a.localeCompare(b));
    const limit = pLimit(6);
    await Promise.all(entries.map(([rel, content]) => limit(async () => {
      const full = join(outDir, rel);
      const dir = dirname(full);
      await safeMkdir(dir);
      await safeWrite(full, content);
    })));
    const appName = getAppName(srcDir);
    const pkgPath = join(outDir, 'package.json');
    if (!existsSync(pkgPath)) writeFileSync(pkgPath, buildPackageJson(meta.hasPages, appName));
    const readmePath = join(outDir, 'README.md');
    if (!existsSync(readmePath)) writeFileSync(readmePath, buildGeneratedReadme());
  } catch (e) {
    if (e instanceof LocusError || (e && (e as any).code)) {
      reportError((e as any) as LocusError, fileMap, opts.errorFormat);
      process.exit(1);
    }
    throw new GeneratorError('Failed generating artifacts', e);
  }

  if (debug) {
    const t1 = Date.now();
    const timings = {
      files: files.length,
      parseMs: tParse1 - tParse0,
      mergeMs: tMerge1 - tParse1,
      generateMs: t1 - tMerge1,
      totalMs: t1 - t0,
    };
  process.stdout.write('[locus][build][timings] ' + JSON.stringify(timings) + '\n');
  }

  if (opts.prismaGenerate) {
    try {
      const schema = join(outDir, 'prisma', 'schema.prisma');
      if (existsSync(schema)) {
        spawnSync('npx', ['prisma', 'generate', '--schema', schema], { stdio: 'ignore' });
      }
    } catch {/* ignore */}
  }

  return { outDir };
}

function findLocusFiles(dir: string): string[] {
  let entries: any;
  try {
    entries = readdirSync(dir, { withFileTypes: true } as any);
  } catch {
    entries = readdirSync(dir);
  }
  // If mocked fs returns string[]
  if (Array.isArray(entries) && typeof entries[0] === 'string') {
    return (entries as string[])
      .map(name => join(dir, name))
      .filter(p => p.endsWith('.locus'));
  }
  // Real dirents path
  const results: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory && entry.isDirectory()) {
      results.push(...findLocusFiles(full));
    } else if (entry.isFile && entry.isFile() && full.endsWith('.locus')) {
      results.push(full);
    } else if (!entry.isDirectory && !entry.isFile) {
      // Fallback for environments lacking isFile/isDirectory on dirent
      try {
        const st = statSync(full);
        if (st.isDirectory()) results.push(...findLocusFiles(full));
        else if (st.isFile() && full.endsWith('.locus')) results.push(full);
      } catch {
        // ignore
      }
    }
  }
  return results;
}

function pLimit(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  const next = () => {
    if (active >= concurrency) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    job();
  };
  return function <T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        Promise.resolve(fn()).then(
          (v) => { active--; resolve(v); next(); },
          (e) => { active--; reject(e); next(); }
        );
      };
      queue.push(run);
      next();
    });
  };
}

async function safeMkdir(dir: string) {
  try {
    if ((fsp as any)?.mkdir) return await (fsp as any).mkdir(dir, { recursive: true });
  } catch {/* ignore */}
  try { mkdirSync(dir, { recursive: true }); } catch {/* ignore */}
}

async function safeWrite(path: string, content: string) {
  try {
    if ((fsp as any)?.writeFile) return await (fsp as any).writeFile(path, content, 'utf8');
  } catch {/* fall through to sync */}
  writeFileSync(path, content);
}
