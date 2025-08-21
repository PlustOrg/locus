import { reportError } from '../../src/cli/reporter';
import { LocusError, PError } from '../../src/errors';

function capture(fn: () => void): string {
  let out = '';
  const orig = process.stderr.write;
  (process.stderr as any).write = (s: any) => { out += String(s); return true; };
  try { fn(); } finally { (process.stderr as any).write = orig; }
  return out;
}

function stripAnsi(s: string) {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('Reporter', () => {
  const fileMap = new Map<string, string>();
  fileMap.set('a.locus', 'entity User {\n  name String\n}\n');

  test('renders Parse Error with tip and codeframe', () => {
    const err = new PError("Expecting token of type --> Colon <-- but found --> 'String' <--", 'a.locus', 2, 8, 6);
    const outRaw = capture(() => reportError(err as LocusError, fileMap));
    const out = stripAnsi(outRaw);
    expect(out).toMatch(/Parse Error/);
    expect(out).toMatch(/Expected ':' but found 'String'/);
    expect(out).toMatch(/Tip: Add a colon/);
    expect(out).toMatch(/a\.locus:2:8/);
    expect(out).toMatch(/2 \|\s+name String[\s\S]*\^~+/);
  });

  test('renders Merge Error heading', () => {
    const m = new LocusError({ code: 'merge_error', message: "Entity 'User' defined multiple times", filePath: 'a.locus', line: 1, column: 8 });
    const out = stripAnsi(capture(() => reportError(m, fileMap)));
    expect(out).toMatch(/Merge Error/);
  });
});
