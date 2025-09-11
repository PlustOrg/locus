import { PError } from '../../src/errors';
import { errorToDiagnostic } from '../../src/errors';

test('diagnostic filtering by severity', () => {
  const e1: any = new PError('err1','a.locus',1,1,1); // default error
  const e2: any = new PError('warn1','b.locus',1,1,1); e2.severity='warning';
  const diags = [e1,e2].map(errorToDiagnostic);
  const filtered = diags.filter(d => d.severity === 'error');
  expect(filtered.length).toBe(1);
});
