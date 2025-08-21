import { reportError } from '../../src/cli/reporter';
import { PError } from '../../src/errors';

describe('Reporter JSON output', () => {
  test('emits JSON line with friendly message and location', () => {
    const fileMap = new Map<string, string>();
    fileMap.set('a.locus', 'entity User {\n  name String\n}\n');
    const err = new PError("Expecting token of type --> Colon <-- but found --> 'String' <--", 'a.locus', 2, 8, 6);
    let out = '';
    const orig = process.stderr.write;
    (process.stderr as any).write = (s: any) => { out += String(s); return true; };
    try {
      reportError(err as any, fileMap, 'json');
    } finally {
      (process.stderr as any).write = orig;
    }
    const parsed = JSON.parse(out);
    expect(parsed.code).toBe('parse_error');
    expect(parsed.message).toMatch(/Expected ':' but found 'String'/);
    expect(parsed.filePath).toBe('a.locus');
    expect(parsed.line).toBe(2);
    expect(parsed.column).toBe(8);
    expect(parsed.length).toBeGreaterThanOrEqual(1);
    expect(parsed.heading).toBe('Parse Error');
  });
});
