import { writeFileSync, existsSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { findLocusFiles, pLimit, safeMkdir, safeWrite } from './utils';
import { parseLocus } from '../parser';
import { mergeAsts } from '../parser/merger';
import { validateUnifiedAstWithPlugins } from '../validator/validate';
import { BuildError, LocusError, errorToDiagnostic, Diagnostic } from '../errors';
import { buildOutputArtifacts, buildPackageJson, buildGeneratedReadme, getAppName, buildTsConfig } from '../generator/outputs';
import { loadConfig } from '../config/config';
import { generateExpressApi, AuthConfig } from '../generator/express';
import { initPluginManager } from '../plugins/manager';
import chalk from 'chalk';
import { reportError, ErrorOutputFormat } from './reporter';
import { recordTiming, exportMetrics } from '../metrics';
import { collectDeprecationWarnings } from '../deprecations';

/**
 * Main build function for Locus CLI.
 * Parses, validates, and generates all project artifacts.
 */
export async function buildProject(opts: {
  srcDir: string;
  outDir?: string;
  debug?: boolean;
  errorFormat?: ErrorOutputFormat;
  prismaGenerate?: boolean;
  dryRun?: boolean;
  emitJs?: boolean;
  suppressWarnings?: boolean;
}) {
  const srcDir = opts.srcDir;
  const outDir = opts.outDir || join(srcDir, 'generated');
  const debug = !!opts.debug;
  const t0 = Date.now();

  // Find all .locus source files
  let files: string[];
  try {
    files = findLocusFiles(srcDir);
  } catch (e) {
    throw new BuildError(`Failed to read source directory: ${srcDir}`, e);
  }

  // Map of file contents for error reporting
  const fileMap = new Map<string, string>();
  const tParse0 = Date.now();
  const config = loadConfig(srcDir);
  const pluginMgr = await initPluginManager(srcDir, config);
  const asts: any[] = [];
  const diagnostics: Diagnostic[] = [];
  // Parse all source files into ASTs
  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf8');
      fileMap.set(filePath, content);
      // Plugin hook: before parsing
      try { await pluginMgr.onParseStart(filePath, content); } catch {/* ignore */}
      const ast = parseLocus(content as any, filePath);
      asts.push(ast);
    } catch (e) {
      // Collect diagnostics for parse errors
      if (e instanceof LocusError || (e && (e as any).code)) {
        diagnostics.push(errorToDiagnostic(e as any));
        continue;
      }
      throw new BuildError(`Failed to parse ${filePath}: ${(e as any)?.message || e}`, e);
    }
  }
  // If any parse errors, report and exit early
  if (diagnostics.length) {
    reportError([], fileMap, opts.errorFormat); // no-op for pretty
    if (opts.errorFormat === 'json') {
      process.stderr.write(JSON.stringify({ diagnostics }) + '\n');
    } else {
      reportError(new LocusError({ code: 'parse_error', message: diagnostics[0].message, filePath: diagnostics[0].filePath, line: diagnostics[0].line, column: diagnostics[0].column, length: diagnostics[0].length }), fileMap, opts.errorFormat);
    }
    return { outDir, diagnostics, failed: true } as any;
  }
  const tParse1 = Date.now();
  if (opts.debug) {
    process.stdout.write(`[locus][debug] Parsed ${files.length} files in ${tParse1-tParse0}ms\n`);
  }
  recordTiming('parseMs', tParse1 - tParse0);
  // Plugin hook: after each file parsed
  for (let i = 0; i < asts.length; i++) {
    const filePath = files[i];
    try { await pluginMgr.onFileParsed(filePath, asts[i]); } catch {/* collect inside manager */}
  }

  // Plugin hook: after all files parsed (virtual AST injection)
  try { await pluginMgr.onParseComplete(asts); } catch {/* ignore */}
  const allAsts = asts.concat(pluginMgr.virtualAsts);
  // Merge all ASTs into a unified AST
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
  pluginMgr.collectWorkflowStepKinds();
  await pluginMgr.onValidate(merged);
  await validateUnifiedAstWithPlugins(merged, pluginMgr);
  // Collect naming warnings produced during validation
  if ((merged as any).namingWarnings?.length) {
    pluginMgr.warnings.push(...(merged as any).namingWarnings.map((w: string) => `[naming] ${w}`));
  }
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
  if (opts.debug) {
    process.stdout.write(`[locus][debug] Merged ASTs in ${tMerge1-tParse1}ms\n`);
  }
  recordTiming('mergeMs', tMerge1 - tParse1);

  // Generate all build artifacts
  let genMeta: any = {};
  try {
    await pluginMgr.onBeforeGenerate(merged);
    // Detect auth configuration via unified config
    let auth: AuthConfig | undefined;
    if (config.auth?.jwtSecret || config.raw._sections?.auth) {
      const aSection = config.raw._sections?.auth || {};
      auth = {
        jwtSecret: config.auth?.jwtSecret,
        adapterPath: aSection.adapter,
        requireAuth: !!aSection.requireAuth
      } as any;
      if (auth?.jwtSecret && !process.env.LOCUS_JWT_SECRET) process.env.LOCUS_JWT_SECRET = auth.jwtSecret;
    }

    // Generate code and meta
    const { files: artifacts, meta } = buildOutputArtifacts(merged, { srcDir });
    if ((config as any).warnings?.length) {
      meta.warnings = [...(meta.warnings || []), ...(config as any).warnings];
    }
    // Add express server if auth configured
    if (auth) {
      const guarded = (merged.pages || []).filter((p: any) => p.guard).map((p: any) => ({ name: p.name, role: p.guard.role }));
      const expressFiles = generateExpressApi((merged.database?.entities) || [], { auth, pagesWithGuards: guarded });
      for (const [k, v] of Object.entries(expressFiles)) { artifacts[k] = v; }
    }
    // Plugin hook: after code generation
    await pluginMgr.onAfterGenerate({ artifacts, meta });
    pluginMgr.runCustomGenerators(merged);
    Object.assign(artifacts, pluginMgr.extraArtifacts);
  // Append deprecation warnings
  const dep = collectDeprecationWarnings();
  if (dep.length) meta.warnings = [...(meta.warnings || []), ...dep];
    // Optionally suppress warnings
    if (opts.suppressWarnings && meta.warnings?.length) {
      delete (artifacts as any)['GENERATED_WARNINGS.txt'];
    }
    // Add plugin warnings
    meta.warnings = [...(meta.warnings || []), ...pluginMgr.warnings];
    (meta as any).pluginTimings = pluginMgr.timings;
    genMeta = meta;
    if (opts.debug) {
      process.stdout.write(`[locus][debug] Generated artifacts in ${Date.now() - tMerge1}ms\n`);
    }
  recordTiming('generateMs', Date.now() - tMerge1);
    // Dry run: just list files
    if (opts.dryRun) {
      const list = Object.keys(artifacts).sort();
      process.stdout.write('[locus][build][dry-run] files that would be written:\n' + list.map(f => ' - ' + f).join('\n') + '\n');
      return { outDir, dryRun: true, filesPlanned: list, meta: { hasPages: meta.hasPages, warnings: meta.warnings } } as any;
    }
    // Write all generated files
    const entries = Object.entries(artifacts).sort(([a], [b]) => a.localeCompare(b));
    const limit = pLimit(6);
    await Promise.all(entries.map(([rel, content]) => limit(async () => {
      const full = join(outDir, rel);
      const dir = dirname(full);
      await safeMkdir(dir);
      await safeWrite(full, content as string);
    })));
    // Write package.json, README, tsconfig if missing
    const appName = getAppName(srcDir);
    const pkgPath = join(outDir, 'package.json');
    if (!existsSync(pkgPath)) writeFileSync(pkgPath, buildPackageJson(meta.hasPages, appName));
    const readmePath = join(outDir, 'README.md');
    if (!existsSync(readmePath)) writeFileSync(readmePath, buildGeneratedReadme());
    const tsconfigPath = join(outDir, 'tsconfig.json');
    if (!existsSync(tsconfigPath) && !opts.dryRun) {
      writeFileSync(tsconfigPath, buildTsConfig());
    }
    // Optionally compile TS -> JS
    if (opts.emitJs && !opts.dryRun) {
      try {
        const res = spawnSync('npx', ['tsc', '--project', tsconfigPath, '--outDir', 'dist', '--declaration', 'false', '--emitDeclarationOnly', 'false'], { cwd: outDir, stdio: 'ignore' });
        if (res.status !== 0) process.stderr.write('[locus][build] tsc exited with code ' + res.status + '\n');
      } catch {/* ignore compile errors */}
    }
    // Print warnings unless suppressed
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
    process.stderr.write(String((e as any)?.message || e) + '\n');
    process.exit(1);
  }

  // Print timing summary if debug enabled
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
  try { const m = exportMetrics(); safeWrite(join(outDir, 'BUILD_METRICS.json'), JSON.stringify({ ...m, ...timings }, null, 2)); } catch {/* ignore */}
  }

  // Optionally run prisma generate
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

