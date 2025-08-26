import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import { LocusError, errorToDiagnostic, Diagnostic } from '../errors';
import { parseLocus } from '../parser';
import { mergeAsts } from '../parser/merger';
import { validateUnifiedAst } from '../validator/validate';
import { PluginManager } from '../plugins/manager';
import {
  buildOutputArtifacts,
  buildPackageJson,
  buildGeneratedReadme,
  getAppName,
  buildTsConfig,
} from '../generator/outputs';
import { generateExpressApi, AuthConfig } from '../generator/express';
import { pLimit } from './utils/concurrency';
import { safeMkdir, safeWrite } from './utils/files';

/**
 * Parses all .locus files in the project.
 * @param files The list of .locus files to parse.
 * @param pluginMgr The plugin manager instance.
 * @returns An object containing the parsed ASTs, a map of file contents, and any diagnostics.
 */
export async function parseLocusFiles(
  files: string[],
  pluginMgr: PluginManager
): Promise<{
  asts: any[];
  fileMap: Map<string, string>;
  diagnostics: Diagnostic[];
  filePaths: string[];
}> {
  const asts: any[] = [];
  const fileMap = new Map<string, string>();
  const diagnostics: Diagnostic[] = [];
  const filePaths: string[] = [];

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf8');
      fileMap.set(filePath, content);

      try {
        await pluginMgr.onParseStart(filePath, content);
      } catch {
        // Ignore plugin errors during this hook
      }

      const ast = parseLocus(content, filePath);
      asts.push(ast);
      filePaths.push(filePath);
    } catch (e) {
      if (e instanceof LocusError || (e && (e as any).code)) {
        diagnostics.push(errorToDiagnostic(e as any));
        continue; // Continue parsing other files
      }
      throw new Error(`Failed to parse ${filePath}: ${(e as any)?.message || e}`);
    }
  }

  return { asts, fileMap, diagnostics, filePaths };
}

/**
 * Merges and validates the ASTs.
 * @param asts The array of ASTs to merge.
 * @param pluginMgr The plugin manager instance.
 * @returns The merged and validated AST.
 */
export async function mergeAndValidateAsts(
  asts: any[],
  filePaths: string[],
  pluginMgr: PluginManager
): Promise<any> {
  // Allow plugins to run file-parsed hooks
  for (let i = 0; i < asts.length; i++) {
    const ast = asts[i];
    const filePath = filePaths[i];
    try {
      await pluginMgr.onFileParsed(filePath, ast);
    } catch {
      // Collect errors inside the manager
    }
  }

  // Allow plugins to inject virtual ASTs
  try {
    await pluginMgr.onParseComplete(asts);
  } catch {
    // Ignore plugin errors
  }

  const allAsts = asts.concat(pluginMgr.virtualAsts);
  const mergedAst = mergeAsts(allAsts);

  // Allow plugins to validate the unified AST
  await pluginMgr.onValidate(mergedAst);
  validateUnifiedAst(mergedAst);

  return mergedAst;
}

/**
 * Generates and writes the output artifacts.
 * @param mergedAst The unified AST.
 * @param config The project configuration.
 * @param pluginMgr The plugin manager.
 * @param srcDir The source directory.
 * @param outDir The output directory.
 * @param opts Additional build options.
 * @returns A promise that resolves with the generation metadata.
 */
export async function generateAndWriteArtifacts(
  mergedAst: any,
  config: any,
  pluginMgr: PluginManager,
  srcDir: string,
  outDir: string,
  opts: {
    dryRun?: boolean;
    suppressWarnings?: boolean;
    emitJs?: boolean;
  }
): Promise<any> {
  await pluginMgr.onBeforeGenerate(mergedAst);

  // Detect auth configuration
  let auth: AuthConfig | undefined;
  if (config.auth?.jwtSecret || config.raw._sections?.auth) {
    const authSection = config.raw._sections?.auth || {};
    auth = {
      jwtSecret: config.auth?.jwtSecret,
      adapterPath: authSection.adapter,
      requireAuth: !!authSection.requireAuth,
    } as any;
    if (auth?.jwtSecret && !process.env.LOCUS_JWT_SECRET) {
      process.env.LOCUS_JWT_SECRET = auth.jwtSecret;
    }
  }

  const { files: artifacts, meta } = buildOutputArtifacts(mergedAst, { srcDir });

  if (config.warnings?.length) {
    meta.warnings = [...(meta.warnings || []), ...config.warnings];
  }

  // Augment express server if auth is configured
  if (auth) {
    const guardedPages = (mergedAst.pages || [])
      .filter((p: any) => p.guard)
      .map((p: any) => ({ name: p.name, role: p.guard.role }));
    const expressFiles = generateExpressApi(mergedAst.database?.entities || [], {
      auth,
      pagesWithGuards: guardedPages,
    });
    Object.assign(artifacts, expressFiles);
  }

  // Allow plugins to modify artifacts
  await pluginMgr.onAfterGenerate({ artifacts, meta });
  pluginMgr.runCustomGenerators(mergedAst);
  Object.assign(artifacts, pluginMgr.extraArtifacts);

  if (opts.suppressWarnings && meta.warnings?.length) {
    delete (artifacts as any)['GENERATED_WARNINGS.txt'];
  }

  meta.warnings = [...(meta.warnings || []), ...pluginMgr.warnings];
  (meta as any).pluginTimings = pluginMgr.timings;

  if (opts.dryRun) {
    const fileList = Object.keys(artifacts).sort();
    process.stdout.write(
      '[locus][build][dry-run] files that would be written:\n' +
        fileList.map((f) => ' - ' + f).join('\n') +
        '\n'
    );
    return {
      dryRun: true,
      filesPlanned: fileList,
      meta: { hasPages: meta.hasPages, warnings: meta.warnings },
    };
  }

  const sortedArtifacts = Object.entries(artifacts).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const limit = pLimit(6);
  await Promise.all(
    sortedArtifacts.map(([relativePath, content]) =>
      limit(async () => {
        const fullPath = join(outDir, relativePath);
        const dir = dirname(fullPath);
        await safeMkdir(dir);
        await safeWrite(fullPath, content as string);
      })
    )
  );

  // Ensure project scaffolding files exist
  const appName = getAppName(srcDir);
  const pkgJsonPath = join(outDir, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    writeFileSync(pkgJsonPath, buildPackageJson(meta.hasPages, appName));
  }
  const readmePath = join(outDir, 'README.md');
  if (!existsSync(readmePath)) {
    writeFileSync(readmePath, buildGeneratedReadme());
  }
  const tsconfigPath = join(outDir, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) {
    writeFileSync(tsconfigPath, buildTsConfig());
  }

  // Optionally compile TypeScript to JavaScript
  if (opts.emitJs) {
    try {
      const res = spawnSync(
        'npx',
        [
          'tsc',
          '--project',
          tsconfigPath,
          '--outDir',
          'dist',
          '--declaration',
          'false',
          '--emitDeclarationOnly',
          'false',
        ],
        { cwd: outDir, stdio: 'ignore' }
      );
      if (res.status !== 0) {
        process.stderr.write(
          '[locus][build] tsc exited with code ' + res.status + '\n'
        );
      }
    } catch {
      // Ignore compilation errors
    }
  }

  if (!opts.suppressWarnings && meta.warnings && meta.warnings.length) {
    for (const warning of meta.warnings) {
      process.stdout.write(chalk.yellow('[locus][warn] ' + warning + '\n'));
    }
  }

  return meta;
}
