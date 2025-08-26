import { readdirSync, writeFileSync, mkdirSync, existsSync, readFileSync, statSync } from 'fs';
import { spawnSync } from 'child_process';
import { promises as fsp } from 'fs';
import { join, dirname } from 'path';
import { parseLocus } from '../parser';
import { mergeAsts } from '../parser/merger';
import { validateUnifiedAst } from '../validator/validate';
// generation now centralized in generator/outputs
import { BuildError, LocusError, errorToDiagnostic, Diagnostic } from '../errors';
import { buildOutputArtifacts, buildPackageJson, buildGeneratedReadme, getAppName, buildTsConfig } from '../generator/outputs';
// Removed legacy direct fs/path config parsing in favor of loadConfig
import { loadConfig } from '../config/config';
import { generateExpressApi, AuthConfig } from '../generator/express';
import { initPluginManager } from '../plugins/manager';
import { reportError, ErrorOutputFormat } from './reporter';
import * as ui from './beautify';

export async function buildProject(opts: { srcDir: string; outDir?: string; debug?: boolean; errorFormat?: ErrorOutputFormat; prismaGenerate?: boolean; dryRun?: boolean; emitJs?: boolean; suppressWarnings?: boolean }) {
  const srcDir = opts.srcDir;
  const outDir = opts.outDir || join(srcDir, 'generated');
  const debug = !!opts.debug;
  const t0 = Date.now();

  ui.info(`Building project in ${srcDir}`);
  let files: string[];
  try {
    files = findLocusFiles(srcDir);
  } catch (e) {
    throw new BuildError(`Failed to read source directory: ${srcDir}`, e);
  }
  ui.info(`Found ${files.length} source files`);
  const fileMap = new Map<string, string>();
  const tParse0 = Date.now();
  const config = loadConfig(srcDir);
  const pluginMgr = await initPluginManager(srcDir, config);
  const asts: any[] = [];
  const diagnostics: Diagnostic[] = [];
  ui.step('Parsing and validating files...');
  for (const fp of files) {
    try {
      const content = readFileSync(fp, 'utf8');
      fileMap.set(fp, content);
      try { await pluginMgr.onParseStart(fp, content); } catch {/* ignore */}
      const ast = parseLocus(content as any, fp);
      asts.push(ast);
    } catch (e) {
      if (e instanceof LocusError || (e && (e as any).code)) {
        diagnostics.push(errorToDiagnostic(e as any));
        continue; // continue parsing others
      }
      throw new BuildError(`Failed to parse ${fp}: ${(e as any)?.message || e}`, e);
    }
  }
  if (diagnostics.length) {
    reportError([], fileMap, opts.errorFormat); // no-op for pretty
    if (opts.errorFormat === 'json') {
      process.stderr.write(JSON.stringify({ diagnostics }) + '\n');
    } else if (diagnostics.length) {
      // render first diagnostic via existing reporter path
      reportError(new LocusError({ code: 'parse_error', message: diagnostics[0].message, filePath: diagnostics[0].filePath, line: diagnostics[0].line, column: diagnostics[0].column, length: diagnostics[0].length }), fileMap, opts.errorFormat);
    }
    return { outDir, diagnostics, failed: true } as any;
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
      const diag = errorToDiagnostic(e as any);
      if (opts.errorFormat === 'json') process.stderr.write(JSON.stringify({ diagnostics: [diag] }) + '\n');
      else reportError(e as any, fileMap, opts.errorFormat);
      return { outDir, diagnostics: [diag], failed: true } as any;
    }
    throw new BuildError(`Failed to merge ASTs: ${(e as any)?.message || e}`, e);
  }
  // Validate unified AST
  try {
    await pluginMgr.onValidate(merged);
    validateUnifiedAst(merged);
  } catch (e) {
    if (e instanceof LocusError || (e && (e as any).code)) {
      const diag = errorToDiagnostic(e as any);
      if (opts.errorFormat === 'json') process.stderr.write(JSON.stringify({ diagnostics: [diag] }) + '\n');
      else reportError(e as any, fileMap, opts.errorFormat);
      return { outDir, diagnostics: [diag], failed: true } as any;
    }
    throw e;
  }
  const tMerge1 = Date.now();

  // Generate artifacts using shared module
  let genMeta: any = {};
  ui.step('Generating code...');
  try {
    await pluginMgr.onBeforeGenerate(merged);
    // detect auth configuration via unified config
    let auth: AuthConfig | undefined;
    if (config.auth?.jwtSecret || config.raw._sections?.auth) {
      const aSection = config.raw._sections?.auth || {};
      auth = { jwtSecret: config.auth?.jwtSecret, adapterPath: aSection.adapter, requireAuth: !!aSection.requireAuth } as any;
      if (auth?.jwtSecret && !process.env.LOCUS_JWT_SECRET) process.env.LOCUS_JWT_SECRET = auth.jwtSecret;
    }

    const { files: artifacts, meta } = buildOutputArtifacts(merged, { srcDir });
    if ((config as any).warnings?.length) {
      meta.warnings = [...(meta.warnings||[]), ...(config as any).warnings];
    }
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
      ui.info('[dry-run] Files that would be written:');
      for (const f of list) {
        console.log('  - ' + f);
      }
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
        ui.info('Compiling TypeScript to JavaScript...');
        try {
          const res = spawnSync('npx', ['tsc', '--project', tsconfigPath, '--outDir', 'dist', '--declaration', 'false', '--emitDeclarationOnly', 'false'], { cwd: outDir, stdio: 'ignore' });
          if (res.status !== 0) ui.warn(`tsc exited with code ${res.status}`);
        } catch (e) {
          ui.warn(`Could not run tsc: ${e}`);
        }
      }
  if (!opts.suppressWarnings && genMeta.warnings && genMeta.warnings.length && !opts.dryRun) {
        for (const w of genMeta.warnings) {
          ui.warn(w);
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
    const timingSummary = `
Files: ${timings.files}
Parse: ${timings.parseMs}ms
Merge: ${timings.mergeMs}ms
Generate: ${timings.generateMs}ms
Total: ${timings.totalMs}ms
    `;
    ui.box(timingSummary, 'Build Timings');
  }

  if (opts.prismaGenerate) {
    ui.info('Running `prisma generate`...');
    try {
      const schema = join(outDir, 'prisma', 'schema.prisma');
      if (existsSync(schema)) {
        spawnSync('npx', ['prisma', 'generate', '--schema', schema], { stdio: 'ignore' });
      }
    } catch (e) {
      ui.warn(`Could not run prisma generate: ${e}`);
    }
  }

  ui.success('Build complete');
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
