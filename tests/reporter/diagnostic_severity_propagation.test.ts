import { PError } from '../../src/errors';
import { errorToDiagnostic } from '../../src/errors';

test('severity propagates from custom error', () => {
  const e = new PError('msg','f.locus',1,1,1) as any;
  e.severity = 'warning';
  const d = errorToDiagnostic(e);
  expect(d.severity).toBe('warning');
});
