import chalk from 'chalk';
import boxen from 'boxen';

const brandColor = chalk.hex('#00aaff'); // A nice blue for Locus brand

export function info(message: string) {
  console.log(brandColor('i ') + message);
}

export function success(message: string) {
  console.log(chalk.green('✓ ') + message);
}

export function warn(message: string) {
  console.log(chalk.yellow('! ') + message);
}

export function error(message: string) {
  console.log(chalk.red('✗ ') + message);
}

export function step(message: string) {
  console.log(chalk.bold.underline(`\nStep: ${message}\n`));
}

export function box(content: string, title?: string) {
    console.log(
        boxen(content, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
            title: title ? brandColor.bold(title) : undefined,
            titleAlignment: 'center',
        })
    );
}

export function devServerBanner(info: {
  appName: string;
  apiPort: number;
  hasPages: boolean;
  nextPort?: number;
  theme: boolean;
  prismaClient: boolean;
  enableCors: boolean;
  watchPattern: string;
  routeCount: number;
  prismaHint: boolean;
}) {
  const lines: string[] = [];
  lines.push(`${chalk.bold('App')}: ${chalk.cyan(info.appName)}`);
  lines.push(`${chalk.bold('API')}: ${chalk.cyan(`http://localhost:${info.apiPort}`)} (routes: ${info.routeCount})`);
  if (info.hasPages) lines.push(`${chalk.bold('Web')}: ${chalk.cyan(`http://localhost:${info.nextPort || 3000}`)}`);
  lines.push('');
  lines.push(`${chalk.bold('Theme')}: ${info.theme ? chalk.green('✓') : chalk.red('✗')}   ${chalk.bold('Prisma')}: ${info.prismaClient ? chalk.green('✓') : chalk.red('✗')}${info.prismaHint ? chalk.yellow(' (run prisma generate)') : ''}`);
  lines.push(`${chalk.bold('Watching')}: ${chalk.dim(info.watchPattern)}`);
  lines.push(`${chalk.bold('CORS')}: ${info.enableCors ? chalk.green('on') : chalk.red('off')}  ${chalk.bold('NODE_ENV')}: ${chalk.dim(process.env.NODE_ENV || 'development')}`);
  lines.push('');
  lines.push(chalk.dim('Ctrl+C to stop'));

  box(lines.join('\n'), 'Locus Dev Server');
}

export function finalMessage(appName: string) {
    const message = `
${brandColor.bold('Congratulations! Your Locus application is ready.')}

Next steps:
  1. ${chalk.cyan('cd generated')}
  2. ${chalk.cyan('npm install')}
  3. ${chalk.cyan('npm run dev')}

Happy coding!
`;
    box(message, `Locus App: ${appName}`);
}
