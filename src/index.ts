#!/usr/bin/env node
import { Command } from 'commander';
import { runDbMigrate, runDbStudio } from './cli/db';
import { buildProject } from './cli/build';
import { dev as devCmd } from './cli/dev';
import type { ErrorOutputFormat } from './cli/reporter';
import path from 'path';
import { readFileSync } from 'fs';
import { newProject } from './cli/new';
import { deploy as deployCmd } from './cli/deploy';
import { listPlugins, doctorPlugins } from './cli/plugins';

const program = new Command();
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
  .option('--no-warn', 'suppress non-error warnings', false)
  .option('--dry-run', 'show files that would be generated without writing them', false)
  .action(async (opts: any) => {
    const srcDir = path.resolve(opts.src);
    const outDir = path.resolve(opts.out);
  await buildProject({ srcDir, outDir, errorFormat: opts.errors as ErrorOutputFormat, prismaGenerate: !!opts.prismaGenerate, dryRun: !!opts.dryRun, emitJs: !!opts.emitJs, suppressWarnings: !!opts.noWarn });
  });

program
  .command('dev')
  .description('Run dev mode with file watching')
  .option('--src <dir>', 'source dir', '.')
  .option('--errors <format>', 'error output format: pretty|json', 'pretty')
  .option('--quiet', 'suppress banner and startup logs', false)
  .option('--log-file <file>', 'write all dev output (including child stderr) to a log file')
  .option('--emit-js', 'compile generated TS to JS continuously (tsc --watch) and run compiled server', false)
  .option('--no-warn', 'suppress non-error warnings', false)
  .action(async (opts: any) => {
    const srcDir = path.resolve(opts.src);
  await devCmd({ srcDir, errorFormat: opts.errors as ErrorOutputFormat, quiet: !!opts.quiet, logFile: opts.logFile, emitJs: !!opts.emitJs, suppressWarnings: !!opts.noWarn });
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

program.parseAsync().catch((e) => { process.stderr.write(String(e) + '\n'); process.exit(1); });

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
