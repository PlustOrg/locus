#!/usr/bin/env node
import { Command } from 'commander';
import { runDbMigrate, runDbStudio } from './cli/db';
import { buildProject } from './cli/build';
import { dev as devCmd } from './cli/dev';
import type { ErrorOutputFormat } from './cli/reporter';
import path from 'path';
import { readFileSync, existsSync } from 'fs';
import { newProject } from './cli/new';
import { deploy as deployCmd } from './cli/deploy';
import { listPlugins, doctorPlugins } from './cli/plugins';
import { initPluginManager } from './plugins/manager';
import { findLocusFiles } from './cli/utils';
import { parseLocus } from './parser';
import { mergeAsts } from './parser/merger';
import { validateUnifiedAstWithPlugins } from './validator/validate';
import { executeWorkflow } from './workflow/runtime';
import { formatProject } from './cli/format';
import { checkForUpdate } from './cli/updateCheck';
import { parseUi } from './parser/uiParser';

const program = new Command();
// Prevent duplicate command definitions if this module is imported more than once in the same process (tests)
const defined = new Set<string>();
const safeCommand = (name: string) => {
  if (defined.has(name)) return null as any; defined.add(name); return program.command(name);
};
program.name('locus').description('Locus compiler CLI');

program
  .command('db')
  .description('Database utilities')
  .argument('<sub>', 'subcommand: migrate|studio')
  .option('--cwd <dir>', 'working directory')
  .action(async (sub: string, opts: any) => {
    const cwd = opts.cwd || process.cwd();
    if (sub === 'migrate') await runDbMigrate({ cwd });
    else if (sub === 'studio') await runDbStudio({ cwd });
    else program.help();
  });


program
  .command('build')
  .description('Build the project outputs')
  .option('--src <dir>', 'source dir', '.')
  .option('--out <dir>', 'output dir', 'generated')
  .option('--errors <format>', 'error output format: pretty|json', 'pretty')
  .option('--prisma-generate', 'run prisma generate after build', false)
  .option('--emit-js', 'after generating TS sources, compile to JS in dist/ and adjust package scripts', false)
  .option('--suppress-warnings', 'suppress non-error warnings', false)
  .option('--debug', 'print detailed timing and performance logs', false)
  .option('--dry-run', 'show files that would be generated without writing them', false)
  .action(async (opts: any) => {
    const srcDir = path.resolve(opts.src);
    const outDir = path.resolve(opts.out);
    await buildProject({
      srcDir,
      outDir,
      errorFormat: opts.errors as ErrorOutputFormat,
      prismaGenerate: !!opts.prismaGenerate,
      dryRun: !!opts.dryRun,
      emitJs: !!opts.emitJs,
      suppressWarnings: !!opts.suppressWarnings,
      debug: !!opts.debug
    });
  });


program
  .command('dev')
  .description('Run dev mode with file watching')
  .option('--src <dir>', 'source dir', '.')
  .option('--errors <format>', 'error output format: pretty|json', 'pretty')
  .option('--quiet', 'suppress banner and startup logs', false)
  .option('--log-file <file>', 'write all dev output (including child stderr) to a log file')
  .option('--emit-js', 'compile generated TS to JS continuously (tsc --watch) and run compiled server', false)
  .option('--suppress-warnings', 'suppress non-error warnings', false)
  .option('--debug', 'print detailed timing and performance logs', false)
  .action(async (opts: any) => {
    const srcDir = path.resolve(opts.src);
    await devCmd({
      srcDir,
      errorFormat: opts.errors as ErrorOutputFormat,
      quiet: !!opts.quiet,
      logFile: opts.logFile,
      emitJs: !!opts.emitJs,
      suppressWarnings: !!opts.suppressWarnings,
      debug: !!opts.debug
    });
  });

program
  .command('check')
  .description('Parse and validate source without generating outputs')
  .option('--src <dir>', 'source dir', '.')
  .option('--errors <format>', 'error output format: pretty|json', 'pretty')
  .action(async (opts: any) => {
    const srcDir = path.resolve(opts.src);
    const config = (await import('./config/config')).loadConfig(srcDir);
    const pluginMgr = await initPluginManager(srcDir, config);
    const files = findLocusFiles(srcDir);
    const asts: any[] = [];
    let hadError = false;
    for (const f of files) {
      try {
        const content = readFileSync(f, 'utf8');
        const ast = parseLocus(content, f);
        asts.push(ast);
      } catch (e: any) {
        hadError = true;
        process.stderr.write('Parse error: ' + (e.message || e) + '\n');
      }
    }
    if (hadError) { process.exit(1); }
    await pluginMgr.onParseComplete(asts);
    const merged = mergeAsts(asts.concat(pluginMgr.virtualAsts));
    try {
      pluginMgr.collectWorkflowStepKinds();
      await pluginMgr.onValidate(merged);
      await validateUnifiedAstWithPlugins(merged, pluginMgr);
  await (pluginMgr as any).runCapabilityValidations?.(merged);
    } catch (e: any) {
      process.stderr.write('Validation error: ' + (e.message || e) + '\n');
      process.exit(1);
    }
    const warnings = [...pluginMgr.warnings, ...((merged as any).namingWarnings || [])];
    if (warnings.length) {
      for (const w of warnings) process.stdout.write('[locus][warn] ' + w + '\n');
    }
    process.stdout.write('Check succeeded. Files: ' + files.length + '\n');
  });

program
  .command('new')
  .description('Scaffold a new Locus project')
  .argument('<name>', 'project name')
  .option('--cwd <dir>', 'working directory', '.')
  .action(async (name: string, opts: any) => {
    const cwd = path.resolve(opts.cwd);
    newProject({ cwd, name });
  });


program
  .option('--version', 'Print the Locus CLI version')
  .action(() => {
    // Print version from package.json
    try {
      const pkgPath = path.join(__dirname, '../package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      process.stdout.write(pkg.version + '\n');
    } catch {
      process.stdout.write('unknown\n');
    }
    process.exit(0);
  });


program
  .command('plugins')
  .description('Plugin utilities')
  .argument('<sub>', 'subcommand: list|doctor')
  .option('--src <dir>', 'source dir', '.')
  .action(async (sub: string, opts: any) => {
    const srcDir = path.resolve(opts.src);
    if (sub === 'list') {
      const names = await listPlugins(srcDir);
      process.stdout.write(names.join('\n') + '\n');
    } else if (sub === 'doctor') {
      const rep = await doctorPlugins(srcDir);
      process.stdout.write(JSON.stringify(rep, null, 2) + '\n');
    } else {
      process.stderr.write('Unknown plugins subcommand: ' + sub + '\n');
      process.exit(1);
    }
  });

program
  .command('deploy')
  .description('Deploy using Locus.toml')
  .argument('<env>', 'environment, e.g., production or staging')
  .option('--cwd <dir>', 'working directory', '.')
  .action(async (env: string, opts: any) => {
    const cwd = path.resolve(opts.cwd);
    await deployCmd({ cwd, env });
  });
  program
    .command('workflow:run')
    .description('Execute a workflow by name (experimental)')
    .argument('<name>', 'workflow name')
    .option('--src <dir>', 'source dir', '.')
    .option('--inputs <json>', 'JSON object of input bindings', '{}')
    .option('--dry-run', 'parse/validate only, do not execute', false)
    .action(async (name: string, opts: any) => {
      const srcDir = path.resolve(opts.src || '.');
      const config = (await import('./config/config')).loadConfig(srcDir);
      const pluginMgr = await initPluginManager(srcDir, config);
      const files = findLocusFiles(srcDir);
      const asts: any[] = [];
      for (const f of files) {
        const content = readFileSync(f, 'utf8');
        const ast = parseLocus(content, f);
        asts.push(ast);
      }
      await pluginMgr.onParseComplete(asts);
      const merged = mergeAsts(asts.concat(pluginMgr.virtualAsts));
      pluginMgr.collectWorkflowStepKinds();
      await pluginMgr.onValidate(merged);
      await validateUnifiedAstWithPlugins(merged, pluginMgr);
      const wf = (merged.workflows || []).find(w => w.name === name);
      if (!wf) { process.stderr.write(`Workflow not found: ${name}\n`); process.exit(1); }
      if (opts.dryRun) { process.stdout.write(`Workflow '${name}' validated successfully.\n`); return; }
      let inputs: any = {};
      try { inputs = JSON.parse(opts.inputs || '{}'); } catch { process.stderr.write('Invalid --inputs JSON.\n'); process.exit(1); }
      const log = executeWorkflow(wf as any, { inputs, pluginManager: pluginMgr });
      process.stdout.write(JSON.stringify(log, null, 2) + '\n');
    });


program
  .command('format')
  .description('Format all .locus source files')
  .option('--src <dir>', 'source dir', '.')
  .action((opts: any) => {
    const srcDir = path.resolve(opts.src || '.');
    const changed = formatProject(srcDir);
    process.stdout.write(changed.length ? `Formatted ${changed.length} file(s)\n` : 'No formatting changes.\n');
  });

program
  .command('doctor')
  .description('Diagnose environment & configuration')
  .option('--src <dir>', 'source dir', '.')
  .action(async (opts:any) => {
    const srcDir = path.resolve(opts.src || '.');
    const config = (await import('./config/config')).loadConfig(srcDir);
    const report: any = {
      node: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      flags: config.flags || {},
      suppressDeprecated: !!config.suppressDeprecated,
      performance: config.performance || {},
      env: Object.keys(process.env).filter(k => k.startsWith('LOCUS_')),
  pluginPerfCache: (()=>{ try { const p = path.join(process.cwd(), '.locus_plugin_perf.json'); return existsSync(p) ? 'present' : 'absent'; } catch { return 'unknown'; }})()
    };
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
  });

safeCommand('explain <code>')
  .description('Explain an error/diagnostic code')
  .action(async (code: string) => {
    const { ErrorCatalog } = await import('./errors');
    const norm = code.trim().toUpperCase();
    const msg = (ErrorCatalog as any)[norm] || 'Unknown code';
    process.stdout.write(`${norm}: ${msg}\n`);
  });

// Experimental: dump UI AST for raw snippet from stdin
safeCommand('ui:ast')
  ?.description('Parse a UI snippet from stdin and print the structured UI AST JSON')
  .action(async () => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => data += c);
    process.stdin.on('end', () => {
      try {
        const ast = parseUi(data);
        process.stdout.write(JSON.stringify(ast, null, 2) + '\n');
      } catch (e:any) {
        process.stderr.write('UI parse error: ' + (e.message || e) + '\n');
        process.exit(1);
      }
    });
  });

  setTimeout(()=>{ try { checkForUpdate(); } catch {/* ignore */} }, 5);
  program.parseAsync().catch((e) => { process.stderr.write(String(e) + '\n'); process.exit(1); });

