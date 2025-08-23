import { parseLocus } from '../../src/parser';
import { reportError } from '../../src/cli/reporter';

// Capture stderr writes
let stderrData = '';
const origWrite = process.stderr.write;

describe('CLI errorFormat=json', () => {
  beforeEach(() => { stderrData = ''; (process.stderr.write as any) = (chunk: any) => { stderrData += chunk; return true; }; });
  afterEach(() => { (process.stderr.write as any) = origWrite; });

  test('reporter json output shape for parse error', () => {
    const fileMap = new Map<string, string>();
    const src = 'database { entity User { name String } }'; // missing colon
    const file = 'bad.locus';
    fileMap.set(file, src);
    try {
      parseLocus(src, file);
      throw new Error('Expected parse error not thrown');
    } catch (e: any) {
      reportError(e, fileMap, 'json');
      const lines = stderrData.trim().split(/\n/);
      const parsed = JSON.parse(lines[lines.length - 1]);
      expect(parsed.code).toBe('parse_error');
  expect(parsed.message).toMatch(/Colon/);
      expect(parsed.filePath).toBe(file);
    }
  });
});
