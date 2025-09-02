// Snapshot diff stabilizer: normalizes volatile substrings for deterministic hashing / tests.
// Applied before hash generation and optional when writing manifest.

export function stabilizeContent(input: string): string {
  return input
    // ISO timestamps
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z/g, '<ISO_TIMESTAMP>')
    // Ports like :3001, :3002 produced during dev server fallback
    .replace(/:300\d/g, ':<PORT>')
    // Temp dirs on macOS /var/folders/... random segment
    .replace(/\/var\/folders\/[A-Za-z0-9_\-\/]+/g, '<TMP_DIR>')
    // Absolute user home paths (basic)
    .replace(/\/Users\/[A-Za-z0-9_.-]+/g, '<HOME>')
    // Windows temp patterns if any appear
    .replace(/[A-Z]:\\\\Users\\\\[A-Za-z0-9_.-]+/g, '<WIN_HOME>');
}
