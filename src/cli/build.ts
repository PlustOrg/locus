import { writeFileSync, existsSync, readFileSync, appendFileSync } from 'fs';
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
import { recordTiming, exportMetrics, incDiagnostic, recordMemoryPhase } from '../metrics';
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
  const memStart = process.memoryUsage().heapUsed;

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
  const mem0 = process.memoryUsage().heapUsed;
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
    incDiagnostic(diagnostics.length);
    reportError([], fileMap, opts.errorFormat); // no-op for pretty
    if (opts.errorFormat === 'json') {
      const summary = diagnostics.reduce((acc:any,d)=>{acc[d.code]=(acc[d.code]||0)+1;return acc;},{});
      process.stderr.write(JSON.stringify({ diagnostics, summary }) + '\n');
    } else {
      reportError(new LocusError({ code: 'parse_error', message: diagnostics[0].message, filePath: diagnostics[0].filePath, line: diagnostics[0].line, column: diagnostics[0].column, length: diagnostics[0].length }), fileMap, opts.errorFormat);
    }
    return { outDir, diagnostics, failed: true, summary: diagnostics.reduce((acc:any,d)=>{acc[d.code]=(acc[d.code]||0)+1;return acc;},{}) } as any;
  }
  const tParse1 = Date.now();
  const memAfterParse = process.memoryUsage().heapUsed;
  if (opts.debug) {
    process.stdout.write(`[locus][debug] Parsed ${files.length} files in ${tParse1-tParse0}ms\n`);
  }
  const parseDur = tParse1 - tParse0;
  recordTiming('parseMs', parseDur);
  recordMemoryPhase('parse', memAfterParse - mem0);
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
  incDiagnostic(1);
  if (opts.errorFormat === 'json') process.stderr.write(JSON.stringify({ diagnostics: [diag], summary: { [diag.code]:1 } }) + '\n');
      else reportError(e as any, fileMap, opts.errorFormat);
  return { outDir, diagnostics: [diag], failed: true, summary: { [diag.code]:1 } } as any;
    }
    throw new BuildError(`Failed to merge ASTs: ${(e as any)?.message || e}`, e);
  }
  // Validate unified AST
  try {
  pluginMgr.collectWorkflowStepKinds();
  // Second-pass assign plugin-defined step kinds for unknown steps by prefix match
  try {
    const kinds = Object.keys(pluginMgr.workflowStepKinds || {});
    if (kinds.length && (merged as any).workflows) {
      for (const wf of (merged as any).workflows as any[]) {
        if (!Array.isArray(wf.steps)) continue;
        for (const st of wf.steps) {
          if (st.kind === 'unknown' && typeof st.raw === 'string') {
            const trimmed = st.raw.trim();
            const k = kinds.find(kd => trimmed.startsWith(kd + ' ') || trimmed === kd || trimmed.startsWith('const ') && trimmed.includes('= ' + kd + ' '));
            if (k) st.kind = k;
          }
        }
      }
    }
  } catch {/* ignore */}
  await pluginMgr.onValidate(merged);
  await validateUnifiedAstWithPlugins(merged, pluginMgr);
  await pluginMgr.runCapabilityValidations(merged);
  // Collect naming warnings produced during validation
  if ((merged as any).namingWarnings?.length) {
    pluginMgr.warnings.push(...(merged as any).namingWarnings.map((w: string) => `[naming] ${w}`));
  }
  } catch (e) {
    if (e instanceof LocusError || (e && (e as any).code)) {
      const diag = errorToDiagnostic(e as any);
  incDiagnostic(1);
  if (opts.errorFormat === 'json') process.stderr.write(JSON.stringify({ diagnostics: [diag], summary: { [diag.code]:1 } }) + '\n');
      else reportError(e as any, fileMap, opts.errorFormat);
  return { outDir, diagnostics: [diag], failed: true, summary: { [diag.code]:1 } } as any;
    }
    throw e;
  }
  const tMerge1 = Date.now();
  const memAfterMerge = process.memoryUsage().heapUsed;
  if (opts.debug) {
    process.stdout.write(`[locus][debug] Merged ASTs in ${tMerge1-tParse1}ms\n`);
  }
  const mergeDur = tMerge1 - tParse1;
  recordTiming('mergeMs', mergeDur);
  recordMemoryPhase('merge', memAfterMerge - memAfterParse);

  // Generate all build artifacts
  let genMeta: any = {};
  let genDur = 0;
  let memAfterGenerate = 0;
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
  const expressFiles = generateExpressApi((merged.database?.entities) || [], { auth, pagesWithGuards: guarded, uploads: (merged as any).uploads || [] });
      for (const [k, v] of Object.entries(expressFiles)) { artifacts[k] = v; }
    }
    // Plugin hook: after code generation
    await pluginMgr.onAfterGenerate({ artifacts, meta });
    pluginMgr.runCustomGenerators(merged);
    Object.assign(artifacts, pluginMgr.extraArtifacts);
  // Append deprecation warnings
  const dep = collectDeprecationWarnings();
  if (dep.length && !config.suppressDeprecated) meta.warnings = [...(meta.warnings || []), ...dep];
    // Optionally suppress warnings
    if (opts.suppressWarnings && meta.warnings?.length) {
      delete (artifacts as any)['GENERATED_WARNINGS.txt'];
    }
    // Add plugin warnings
    meta.warnings = [...(meta.warnings || []), ...pluginMgr.warnings];
    (meta as any).pluginTimings = pluginMgr.timings;
    // Plugin performance budget reporting (diff vs previous run)
    try {
      const perfPath = join(outDir, 'PLUGIN_TIMINGS.json');
      let prev: any = null;
      if (existsSync(perfPath)) {
        try { prev = JSON.parse(readFileSync(perfPath,'utf8')); } catch {/* ignore */}
      }
      const current = { generatedAt: new Date().toISOString(), timings: pluginMgr.timings };
      writeFileSync(perfPath, JSON.stringify(current, null, 2));
      if (prev && prev.timings && pluginMgr.timings) {
        const diffs: string[] = [];
        for (const [k,v] of Object.entries(pluginMgr.timings) as any) {
          const before = (prev.timings as any)[k];
            if (typeof before === 'number') {
              const delta = (v as number) - before;
              if (Math.abs(delta) > 5) { // >5ms change significant threshold
                meta.warnings = [...(meta.warnings||[]), `[plugin-perf] ${k} changed by ${delta}ms (prev ${before}ms now ${v}ms)`];
                diffs.push(k);
              }
            }
        }
        if (diffs.length) (meta as any).pluginPerfDiff = diffs;
      }
    } catch {/* ignore perf reporting errors */}
    genMeta = meta;
    if (opts.debug) {
      process.stdout.write(`[locus][debug] Generated artifacts in ${Date.now() - tMerge1}ms\n`);
    }
  genDur = Date.now() - tMerge1;
  recordTiming('generateMs', genDur);
  recordMemoryPhase('generate', memAfterGenerate - memAfterMerge);
  memAfterGenerate = process.memoryUsage().heapUsed;
    // Dry run: just list files
    if (opts.dryRun) {
      const list = Object.keys(artifacts).sort();
      process.stdout.write('[locus][build][dry-run] files that would be written:\n' + list.map(f => ' - ' + f).join('\n') + '\n');
      return { outDir, dryRun: true, filesPlanned: list, meta: { hasPages: meta.hasPages, warnings: meta.warnings } } as any;
    }
    // Write all generated files
    const entries = Object.entries(artifacts).sort(([a], [b]) => a.localeCompare(b));
    // incremental diff (basic) comparing to existing BUILD_MANIFEST.json if present
    let diffReport: { added: string[]; removed: string[]; changed: string[] } | undefined;
    const manifestPath = join(outDir, 'BUILD_MANIFEST.json');
    if (existsSync(manifestPath)) {
      try {
        const prev = JSON.parse(readFileSync(manifestPath, 'utf8'));
        const prevSet = new Set<string>((prev.files as any[]) || []);
        const nextList = entries.map(([rel]) => rel);
        const nextSet = new Set(nextList);
        const added = nextList.filter(f => !prevSet.has(f));
        const removed = [...prevSet].filter(f => !nextSet.has(f));
        const changed: string[] = []; // placeholder (content hash comparison would need individual hashes)
        diffReport = { added, removed, changed };
        if (debug && (added.length || removed.length)) {
          process.stdout.write('[locus][build][diff] added:' + added.length + ' removed:' + removed.length + '\n');
        }
        (genMeta as any).diff = diffReport;
      } catch {/* ignore */}
    }
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

  // Memory trend logging
  try {
    if (process.env.LOCUS_MEMORY_TREND && !opts.dryRun) {
      const trendPath = process.env.LOCUS_MEMORY_TREND;
      const line = JSON.stringify({
        ts: new Date().toISOString(),
        parseMs: tParse1 - tParse0,
  mergeMs: tMerge1 - tParse1,
  generateMs: genDur,
        heapParseDelta: memAfterParse - mem0,
        heapMergeDelta: memAfterMerge - memAfterParse,
        heapGenDelta: memAfterGenerate - memAfterMerge,
        heapTotalDelta: memAfterGenerate - mem0
      });
      appendFileSync(trendPath, line + '\n');
    }
  } catch {/* ignore */}
  // Metrics summary emission (always write concise summary JSON + history)
  try {
    const memEnd = process.memoryUsage().heapUsed;
    const summary = {
      timestamp: new Date().toISOString(),
      files: files.length,
      timings: { parseMs: tParse1 - tParse0, mergeMs: tMerge1 - tParse1, generateMs: genDur, totalMs: Date.now() - t0 },
      memory: {
        startMB: +(memStart/1024/1024).toFixed(2),
        afterParseMB: +(memAfterParse/1024/1024).toFixed(2),
        afterMergeMB: +(memAfterMerge/1024/1024).toFixed(2),
        afterGenerateMB: +(memAfterGenerate/1024/1024).toFixed(2),
        endMB: +(memEnd/1024/1024).toFixed(2)
      },
      warnings: (genMeta?.warnings||[]).length || 0
    };
  try { safeWrite(join(outDir,'METRICS_SUMMARY.json'), JSON.stringify(summary,null,2)); } catch {/* ignore */}
  try { appendFileSync(join(outDir,'METRICS_HISTORY.jsonl'), JSON.stringify(summary)+'\n'); } catch {/* ignore */}
    // Deprecation stats persistence & auto-cutover evaluation
    try {
      const depWarningsPath = join(outDir,'DEPRECATION_STATS.jsonl');
      // collectDeprecationWarnings already invoked (warnings in genMeta). Extract structured counts from genMeta warnings? Better use metrics module list if future.
      // For now, infer paren_attr counts by scanning warnings.
      const parenCount = (genMeta.warnings||[]).filter((w:string)=>/paren attribute/.test(w)).length;
      const rec = { timestamp: summary.timestamp, paren_attr: parenCount };
  try { appendFileSync(depWarningsPath, JSON.stringify(rec)+'\n'); } catch {/* ignore */}
  let lines: string[] = [];
  try { lines = readFileSync(depWarningsPath,'utf8').trim().split(/\n/).filter(Boolean).slice(-7); } catch {/* ignore */}
      const recent = lines.map(l=>{ try { return JSON.parse(l); } catch { return { paren_attr: 999 }; }});
      const lowUsage = recent.length >= 3 && recent.every(r=> (r.paren_attr||0) < 3);
      // heuristic version cutover when package version >=0.6.0
      let pkgVersion = '0.0.0';
      try { pkgVersion = JSON.parse(readFileSync(join(process.cwd(),'package.json'),'utf8')).version || '0.0.0'; } catch {/* ignore */}
      const versionCut = /^0\.(6|[7-9]|[1-9][0-9])\./.test(pkgVersion) || !/^0\./.test(pkgVersion);
      if ((lowUsage || versionCut) && !process.env.LEGACY_PAREN_ATTRS) {
        safeWrite(join(outDir,'AUTO_PAREN_REMOVAL'), '1');
      }
    } catch {/* ignore dep stat errors */}
  } catch {/* ignore metrics write */}
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

