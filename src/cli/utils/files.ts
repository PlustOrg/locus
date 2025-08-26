import { readdirSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { promises as fsp } from 'fs';
import { join } from 'path';

/**
 * Recursively finds all files with the '.locus' extension in a directory.
 * This function is robust and handles different fs implementations and environments.
 * @param dir The directory to search in.
 * @returns A string array of full file paths.
 */
export function findLocusFiles(dir: string): string[] {
  let entries: any;
  try {
    // The { withFileTypes: true } option returns fs.Dirent objects.
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    // Fallback for environments where withFileTypes is not supported.
    entries = readdirSync(dir);
  }

  // If the environment returns a string array instead of Dirent objects.
  if (Array.isArray(entries) && typeof entries[0] === 'string') {
    return (entries as string[])
      .map(name => join(dir, name))
      .filter(p => p.endsWith('.locus'));
  }

  const results: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory && entry.isDirectory()) {
      results.push(...findLocusFiles(fullPath));
    } else if (entry.isFile && entry.isFile() && fullPath.endsWith('.locus')) {
      results.push(fullPath);
    } else if (!entry.isDirectory && !entry.isFile) {
      // Fallback for environments that do not support isDirectory/isFile on fs.Dirent objects.
      try {
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
          results.push(...findLocusFiles(fullPath));
        } else if (stats.isFile() && fullPath.endsWith('.locus')) {
          results.push(fullPath);
        }
      } catch {
        // Ignore errors for files that cannot be stated.
      }
    }
  }
  return results;
}

/**
 * Safely creates a directory, ignoring errors if it already exists.
 * Uses asynchronous fs.promises.mkdir if available, with a fallback to synchronous mkdirSync.
 * @param dir The directory path to create.
 */
export async function safeMkdir(dir: string): Promise<void> {
  try {
    // Prefer the modern async API.
    await fsp.mkdir(dir, { recursive: true });
  } catch (e) {
    // If the async call fails, try the sync version as a fallback.
    try {
      mkdirSync(dir, { recursive: true });
    } catch (e2) {
        // Ignore errors, which likely mean the directory already exists.
    }
  }
}

/**
 * Safely writes content to a file.
 * Uses asynchronous fs.promises.writeFile if available, with a fallback to synchronous writeFileSync.
 * @param path The full path of the file to write.
 * @param content The content to write to the file.
 */
export async function safeWrite(path: string, content: string): Promise<void> {
  try {
    // Prefer the modern async API.
    await fsp.writeFile(path, content, 'utf8');
  } catch {
    // Fallback to the synchronous version if the async one fails.
    writeFileSync(path, content, 'utf8');
  }
}
