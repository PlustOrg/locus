import { readdirSync, writeFileSync, mkdirSync, existsSync, readFileSync, statSync } from 'fs';
import { spawnSync } from 'child_process';
import { promises as fsp } from 'fs';
import { join, dirname } from 'path';
import { parseLocus } from '../parser';
import { mergeAsts } from '../parser/merger';
import { validateUnifiedAst } from '../validator/validate';
// generation now centralized in generator/outputs
import { BuildError, LocusError } from '../errors';
import { buildOutputArtifacts, buildPackageJson, buildGeneratedReadme, getAppName, buildTsConfig } from '../generator/outputs';
import * as fs from 'fs';
import * as path from 'path';
import { parseToml } from '../config/toml';
import { generateExpressApi, AuthConfig } from '../generator/express';
import { initPluginManager } from '../plugins/manager';
import chalk from 'chalk';
import { reportError, ErrorOutputFormat } from './reporter';
export async function buildProject(opts: { srcDir: string; outDir?: string; debug?: boolean; errorFormat?: ErrorOutputFormat; prismaGenerate?: boolean; dryRun?: boolean; emitJs?: boolean; suppressWarnings?: boolean }) {
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
  const pluginMgr = await initPluginManager(srcDir);
  const asts: any[] = [];
  for (const fp of files) {
    try {
      const content = readFileSync(fp, 'utf8');
      fileMap.set(fp, content);
      try { await pluginMgr.onParseStart(fp, content); } catch {/* ignore */}
      const ast = parseLocus(content as any, fp);
      asts.push(ast);
    } catch (e) {
      if (e instanceof LocusError || (e && (e as any).code)) {
        reportError((e as any) as LocusError, fileMap, opts.errorFormat);
        process.exit(1);
      }
      throw new BuildError(`Failed to parse ${fp}: ${(e as any)?.message || e}`, e);
    }
  }
  const tParse1 = Date.now();
  // per-file parsed hooks
  for (let i=0;i<asts.length;i++) {
    const fp = files[i];
    try { await pluginMgr.onFileParsed(fp, asts[i]); } catch {/* collect inside manager */}
  }
  // parse complete (allow virtual AST injection)
  try { await pluginMgr.onParseComplete(asts); } catch {/* ignore */}
  const allAsts = asts.concat(pluginMgr.virtualAsts);
  let merged;
  try {
  merged = mergeAsts(allAsts);
  } catch (e) {
    if (e instanceof LocusError || (e && (e as any).code)) {
      reportError((e as any) as LocusError, fileMap, opts.errorFormat);
      process.exit(1);
    }
    throw new BuildError(`Failed to merge ASTs: ${(e as any)?.message || e}`, e);
  }
  // Validate unified AST
  try {
    await pluginMgr.onValidate(merged);
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
  let genMeta: any = {};
  try {
    await pluginMgr.onBeforeGenerate(merged);
    // detect auth configuration (Locus.toml optional)
    let auth: AuthConfig | undefined;
    try {
      const tomlPath = path.join(srcDir, 'Locus.toml');
      if (fs.existsSync(tomlPath)) {
        const tomlRaw = fs.readFileSync(tomlPath, 'utf8');
        const toml = parseToml(tomlRaw);
        const a = (toml._sections && toml._sections['auth']) || toml['auth'];
        if (a) {
          auth = {
            adapterPath: a.adapter,
            requireAuth: !!a.requireAuth,
            jwtSecret: a.jwtSecret
          };
          if (auth.jwtSecret && !process.env.LOCUS_JWT_SECRET) process.env.LOCUS_JWT_SECRET = auth.jwtSecret;
        }
      }
    } catch {/* ignore */}

    const { files: artifacts, meta } = buildOutputArtifacts(merged, { srcDir });
    // augment express server if auth configured
    if (auth) {
      const guarded = (merged.pages||[]).filter((p:any)=>p.guard).map((p:any)=>({ name: p.name, role: p.guard.role }));
      const expressFiles = generateExpressApi((merged.database?.entities)||[], { auth, pagesWithGuards: guarded });
      for (const [k,v] of Object.entries(expressFiles)) { artifacts[k] = v; }
    }
    // afterGenerate hook may want to add artifacts
    await pluginMgr.onAfterGenerate({ artifacts, meta });
  // run any custom generators registered during previous hooks
  pluginMgr.runCustomGenerators(merged);
    // merge plugin artifacts
    Object.assign(artifacts, pluginMgr.extraArtifacts);
    if (opts.suppressWarnings && meta.warnings?.length) {
      // Remove warnings artifact if suppression requested
      delete (artifacts as any)['GENERATED_WARNINGS.txt'];
    }
    // add plugin warnings
  meta.warnings = [...(meta.warnings || []), ...pluginMgr.warnings];
  (meta as any).pluginTimings = pluginMgr.timings;
    genMeta = meta;
    if (opts.dryRun) {
      const list = Object.keys(artifacts).sort();
      process.stdout.write('[locus][build][dry-run] files that would be written:\n' + list.map(f => ' - ' + f).join('\n') + '\n');
  return { outDir, dryRun: true, filesPlanned: list, meta: { hasPages: meta.hasPages, warnings: meta.warnings } } as any;
    }
  const entries = Object.entries(artifacts).sort(([a], [b]) => a.localeCompare(b));
    const limit = pLimit(6);
    await Promise.all(entries.map(([rel, content]) => limit(async () => {
      const full = join(outDir, rel);
      const dir = dirname(full);
      await safeMkdir(dir);
      await safeWrite(full, content as string);
    })));
  const appName = getAppName(srcDir);
    const pkgPath = join(outDir, 'package.json');
    if (!existsSync(pkgPath)) writeFileSync(pkgPath, buildPackageJson(meta.hasPages, appName));
    const readmePath = join(outDir, 'README.md');
  if (!existsSync(readmePath)) writeFileSync(readmePath, buildGeneratedReadme());
      // Ensure tsconfig.json exists (Next + ts-node friendliness)
      const tsconfigPath = join(outDir, 'tsconfig.json');
      if (!existsSync(tsconfigPath) && !opts.dryRun) {
        writeFileSync(tsconfigPath, buildTsConfig());
      }
      // Optionally compile TS -> JS (tsc) into dist
      if (opts.emitJs && !opts.dryRun) {
        try {
          const res = spawnSync('npx', ['tsc', '--project', tsconfigPath, '--outDir', 'dist', '--declaration', 'false', '--emitDeclarationOnly', 'false'], { cwd: outDir, stdio: 'ignore' });
          if (res.status !== 0) process.stderr.write('[locus][build] tsc exited with code ' + res.status + '\n');
        } catch {/* ignore compile errors */}
      }
  if (!opts.suppressWarnings && genMeta.warnings && genMeta.warnings.length && !opts.dryRun) {
        for (const w of genMeta.warnings) {
          process.stdout.write(chalk.yellow('[locus][warn] ' + w + '\n'));
        }
      }
    } catch (e) {
      if (e instanceof LocusError || (e && (e as any).code)) {
        reportError((e as any) as LocusError, fileMap, opts.errorFormat);
        process.exit(1);
      }
      // raw generator error
      process.stderr.write(String((e as any)?.message || e) + '\n');
      process.exit(1);
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

  return { outDir, meta: { hasPages: (merged as any)?.pages?.length > 0, warnings: genMeta.warnings || [] } } as any;
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
