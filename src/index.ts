#!/usr/bin/env node
import { Command } from 'commander';
import { runDbMigrate, runDbStudio } from './cli/db';
import { buildProject } from './cli/build';
import { dev as devCmd } from './cli/dev';
import type { ErrorOutputFormat } from './cli/reporter';
import path from 'path';
import { newProject } from './cli/new';
import { deploy as deployCmd } from './cli/deploy';

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
  .option('--dry-run', 'show files that would be generated without writing them', false)
  .action(async (opts: any) => {
    const srcDir = path.resolve(opts.src);
    const outDir = path.resolve(opts.out);
    await buildProject({ srcDir, outDir, errorFormat: opts.errors as ErrorOutputFormat, prismaGenerate: !!opts.prismaGenerate, dryRun: !!opts.dryRun });
  });

program
  .command('dev')
  .description('Run dev mode with file watching')
  .option('--src <dir>', 'source dir', '.')
  .option('--errors <format>', 'error output format: pretty|json', 'pretty')
  .action(async (opts: any) => {
    const srcDir = path.resolve(opts.src);
    await devCmd({ srcDir, errorFormat: opts.errors as ErrorOutputFormat });
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

program.parseAsync().catch((e) => { process.stderr.write(String(e) + '\n'); process.exit(1); });

program
  .command('deploy')
  .description('Deploy using Locus.toml')
  .argument('<env>', 'environment, e.g., production or staging')
  .option('--cwd <dir>', 'working directory', '.')
  .action(async (env: string, opts: any) => {
    const cwd = path.resolve(opts.cwd);
    await deployCmd({ cwd, env });
  });
