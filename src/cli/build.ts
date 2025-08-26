import { join } from 'path';
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import chalk from 'chalk';

import { LocusError, errorToDiagnostic, BuildError } from '../errors';
import { loadConfig } from '../config/config';
import { initPluginManager } from '../plugins/manager';
import { reportError, ErrorOutputFormat } from './reporter';
import { findLocusFiles } from './utils/files';
import {
  parseLocusFiles,
  mergeAndValidateAsts,
  generateAndWriteArtifacts,
} from './build-steps';

export interface BuildOptions {
  srcDir: string;
  outDir?: string;
  debug?: boolean;
  errorFormat?: ErrorOutputFormat;
  prismaGenerate?: boolean;
  dryRun?: boolean;
  emitJs?: boolean;
  suppressWarnings?: boolean;
}

/**
 * Orchestrates the build process for a Locus project.
 * This function coordinates parsing, merging, validation, and artifact generation.
 */
export async function buildProject(opts: BuildOptions): Promise<any> {
  const {
    srcDir,
    debug = false,
    errorFormat = 'pretty',
    prismaGenerate = false,
  } = opts;
  const outDir = opts.outDir || join(srcDir, 'generated');
  const t0 = Date.now();

  // 1. Find all .locus files
  let files: string[];
  try {
    files = findLocusFiles(srcDir);
  } catch (e) {
    throw new BuildError(`Failed to read source directory: ${srcDir}`, e);
  }

  const config = loadConfig(srcDir);
  const pluginMgr = await initPluginManager(srcDir, config);

  // 2. Parse, merge, and validate
  const tParse0 = Date.now();
  const { asts, fileMap, diagnostics, filePaths } = await parseLocusFiles(files, pluginMgr);

  if (diagnostics.length) {
    if (errorFormat === 'json') {
      process.stderr.write(JSON.stringify({ diagnostics }) + '\n');
    } else {
      const errors = diagnostics.map(d => new LocusError(d as any));
      reportError(errors, fileMap, errorFormat);
    }
    return { outDir, diagnostics, failed: true };
  }

  const tParse1 = Date.now();
  let mergedAst;
  try {
    mergedAst = await mergeAndValidateAsts(asts, filePaths, pluginMgr);
  } catch (e) {
    if (e instanceof LocusError) {
      const diag = errorToDiagnostic(e);
      reportError(e, fileMap, errorFormat);
      return { outDir, diagnostics: [diag], failed: true };
    }
    throw e;
  }
  const tMerge1 = Date.now();

  // 3. Generate and write artifacts
  let genMeta: any = {};
  try {
    genMeta = await generateAndWriteArtifacts(mergedAst, config, pluginMgr, srcDir, outDir, opts);
  } catch (e) {
    if (e instanceof LocusError) {
      reportError(e, fileMap, errorFormat);
      process.exit(1);
    }
    process.stderr.write(String((e as any)?.message || e) + '\n');
    process.exit(1);
  }

  // 4. Optionally run prisma generate
  if (prismaGenerate) {
    try {
      const schemaPath = join(outDir, 'prisma', 'schema.prisma');
      if (existsSync(schemaPath)) {
        spawnSync('npx', ['prisma', 'generate', '--schema', schemaPath], {
          stdio: 'ignore',
        });
      }
    } catch {
      // Ignore errors
    }
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
    process.stdout.write(
      '[locus][build][timings] ' + JSON.stringify(timings) + '\n'
    );
  }

  return {
    outDir,
    meta: {
      hasPages: (mergedAst as any)?.pages?.length > 0,
      warnings: genMeta.warnings || [],
    },
  };
}
