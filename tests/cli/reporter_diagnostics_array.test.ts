import { reportError } from '../../src/cli/reporter';
import { PError, VError } from '../../src/errors';

describe('Reporter diagnostics array JSON', () => {
  test('emits diagnostics array when multiple errors provided', () => {
    const fileMap = new Map<string,string>();
    fileMap.set('a.locus','entity X { }');
    const errors = [
      new PError('Example parse issue', 'a.locus', 1, 1, 6),
      new VError('Example validation issue', 'a.locus', 1, 1)
    ];
    let out='';
    const orig = process.stderr.write;
    (process.stderr as any).write = (s: any) => { out += String(s); return true; };
    try {
      reportError(errors as any, fileMap, 'json');
    } finally { (process.stderr as any).write = orig; }
    const parsed = JSON.parse(out);
    expect(Array.isArray(parsed.diagnostics)).toBe(true);
    expect(parsed.diagnostics.length).toBe(2);
    expect(parsed.diagnostics[0].code).toBe('PARSE_ERROR');
    expect(parsed.diagnostics[1].code).toBe('VALIDATION_ERROR');
  });
});
