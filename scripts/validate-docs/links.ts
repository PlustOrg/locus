import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';

export interface LinkIssue {
  file: string;
  target: string;
  line: number;
}

/**
 * Validates the relative markdown links in a file.
 * @param file - The path to the markdown file.
 * @param root - The root directory of the repository.
 * @returns An array of link issues found in the file.
 */
export function validateLinks(file: string, root: string): LinkIssue[] {
  const issues: LinkIssue[] = [];
  const relativePath = file.slice(root.length + 1);
  const rawContent = readFileSync(file, 'utf8');
  const linkRegex = /\[[^\]]+\]\(([^):?#]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(rawContent))) {
    const target = match[1];
    if (target.startsWith('http') || target.startsWith('#') || target.startsWith('mailto:')) {
      continue;
    }

    const baseDir = dirname(file);
    const fullPath = resolve(baseDir, target.split('#')[0]);

    if (!existsSync(fullPath)) {
      const prefix = rawContent.slice(0, match.index);
      const line = (prefix.match(/\n/g)?.length || 0) + 1;
      issues.push({ file: relativePath, target, line });
    }
  }

  return issues;
}
