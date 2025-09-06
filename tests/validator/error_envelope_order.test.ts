import { validationErrorEnvelope } from '../../src/runtime/validateRuntime';

test('error envelope orders by path', () => {
  const unordered = [
    { path: 'b', message: 'x', code: 'required' },
    { path: 'a', message: 'y', code: 'required' },
    { path: 'a.z', message: 'z', code: 'type_mismatch' },
  ];
  const env = validationErrorEnvelope(unordered as any);
  expect(env.errors.map(e => e.path)).toEqual(['a', 'a.z', 'b']);
});
