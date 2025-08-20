import { LocusError } from '../errors';
import chalk from 'chalk';
import boxen from 'boxen';

export function reportError(e: LocusError, fileMap: Map<string, string>) {
  let output = '';
  output += chalk.red.bold('Error: ') + e.message + '\n';
  if (e.filePath) {
    output += chalk.cyan(e.filePath);
    if (e.line) {
      output += `:${e.line}`;
      if (e.column) {
        output += `:${e.column}`;
      }
    }
    output += '\n';
  }

  if (e.filePath && e.line) {
    const content = fileMap.get(e.filePath);
    if (content) {
      const lines = content.split('\n');
      const line = lines[e.line - 1];
      if (line) {
        output += '\n';
        output += `${e.line - 1} | ${lines[e.line - 2] || ''}\n`;
        output += `${e.line} | ${line}\n`;
        if (e.column) {
          output += ' '.repeat(String(e.line).length + 3 + e.column - 1) + chalk.red('^');
        }
        output += `\n${e.line + 1} | ${lines[e.line] || ''}\n`;
      }
    }
  }

  console.error(boxen(output, { padding: 1, margin: 1, borderColor: 'red' }));
}
