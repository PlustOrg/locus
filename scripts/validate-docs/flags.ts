import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Collects all the CLI flags from the documentation files.
 * @param mdFiles - An array of markdown file paths.
 * @returns A set of CLI flags found in the documentation.
 */
function collectDocFlags(mdFiles: string[]): Set<string> {
  const flagSet = new Set<string>();
  const flagRegex = /(?<!var\()--[a-zA-Z][a-zA-Z0-9-]+/g; // Exclude CSS vars used in var(--token)

  for (const file of mdFiles) {
    const rawContent = readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;
    while ((match = flagRegex.exec(rawContent))) {
      const flag = match[0];
      // Filter out obvious non-flags (long separators) or short '--x'
      if (/^--[-]+$/.test(flag) || flag.length < 5) {
        continue;
      }
      flagSet.add(flag);
    }
  }

  return flagSet;
}

/**
 * Collects all the CLI flags from the main CLI entry point file.
 * @param root - The root directory of the repository.
 * @returns A set of CLI flags defined in the CLI.
 */
function collectCliFlags(root: string): Set<string> {
  const indexPath = join(root, 'src', 'index.ts');
  if (!existsSync(indexPath)) {
    return new Set();
  }

  const rawContent = readFileSync(indexPath, 'utf8');
  const flagRegex = /\.option\([^)]*--([a-zA-Z0-9-]+)/g;
  const flagSet = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = flagRegex.exec(rawContent))) {
    flagSet.add('--' + match[1]);
  }

  return flagSet;
}

/**
 * Validates the CLI flags mentioned in the documentation against the ones defined in the CLI.
 * @param mdFiles - An array of markdown file paths.
 * @param root - The root directory of the repository.
 * @returns An object containing the extra and undocumented CLI flags.
 */
export function validateCliFlags(
  mdFiles: string[],
  root: string
): { extraDocFlags: string[]; undocumentedCliFlags: string[] } {
  const docFlags = collectDocFlags(mdFiles);
  const cliFlags = collectCliFlags(root);

  const allowedDocOnly = new Set<string>([
    '--save-dev',
    '--openapi',
    '--emit-client-only',
    '--no-audit',
    '--no-fund',
    '--version',
  ]);
  const allowedCliOnly = new Set<string>(['--version', '--cwd', '--emit-js', '--no-warn', '--watch']);

  const extraDocFlags = [...docFlags].filter(
    flag => !cliFlags.has(flag) && !allowedDocOnly.has(flag)
  );
  const undocumentedCliFlags = [...cliFlags].filter(
    flag => !docFlags.has(flag) && !allowedCliOnly.has(flag)
  );

  return { extraDocFlags, undocumentedCliFlags };
}
