import { validateBodyAgainst, registerPreValidationTransform, registerValidationLogger } from '../../src/runtime/validateRuntime';

const schema = { entity: 'Evt', fields: [ { name: 'count', type: 'integer', optional: false, min: 0 } ] } as any;

test('pre-validation transform can set default and logger records event', () => {
  const logs: any[] = [];
  const unregisterLog = registerValidationLogger(ev => logs.push(ev));
  const unregisterTf = registerPreValidationTransform((body, _schema, _mode) => { if (body.count === undefined) body.count = 5; });
  const res = validateBodyAgainst(schema, {}, 'create');
  unregisterTf();
  unregisterLog();
  expect(res.ok).toBe(true);
  expect(logs.length).toBe(1);
  expect(logs[0].entity).toBe('Evt');
  expect(logs[0].ok).toBe(true);
});
