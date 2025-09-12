import { PError, errorToDiagnostic, filterDiagnostics } from '../../src/errors';

test('suppression filters out matching code and severity', () => {
  const e1: any = new PError('Problem one','a.locus',1,1,1); e1.severity='warning';
  const e2: any = new PError('Problem two','b.locus',1,1,1); e2.severity='error';
  const diags = [e1,e2].map(errorToDiagnostic);
  const filtered = filterDiagnostics(diags, { minSeverity: 'error', suppressMessageRegex: /two/ });
  expect(filtered.length).toBe(0);
});
