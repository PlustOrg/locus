import { createHash } from 'crypto';
import { SnippetResult } from './snippets';

/**
 * Generates a SHA256 hash of the given snippets.
 * @param snippets - An array of snippet results.
 * @returns The hex digest of the hash.
 */
export function generateSnippetHash(snippets: SnippetResult[]): string {
  const hash = createHash('sha256');
  for (const snippet of snippets.filter(s => s.ok)) {
    hash.update(snippet.file + ':' + snippet.index + '\n');
    hash.update(snippet.code.replace(/\r\n/g, '\n'));
  }
  return hash.digest('hex');
}
