import '../src/runtime/jitValidator';
import { validateBodyAgainst } from '../src/runtime/validateRuntime';
import { fastValidate } from '../src/runtime/jitValidator';

const schema: any = { entity: 'Perf', fields: [ { name: 'email', type: 'string', optional: false, email: true }, { name: 'age', type: 'integer', optional: false, min: 0, max: 130 } ] };
const body = { email: 'user@example.com', age: 42 };

function time(label: string, fn: ()=>void) {
  const N = 20000;
  const t0 = Date.now();
  for (let i=0;i<N;i++) fn();
  const dt = Date.now()-t0;
  return { label, ms: dt, perOpUs: (dt*1000/N) };
}

const base = time('base', () => validateBodyAgainst(schema, { ...body }, 'create'));
process.env.LOCUS_VALIDATION_JIT='1';
const jitFn = () => fastValidate(schema, { ...body }, 'create');
// prime
for (let i=0;i<1000;i++) jitFn();
const jit = time('jit', jitFn);

// eslint-disable-next-line no-console
console.log(JSON.stringify({ base, jit, speedup: base.perOpUs / jit.perOpUs }));

if (jit.perOpUs > base.perOpUs * 0.95) {
  // JIT should be at least ~5% faster; adjust threshold as optimized
  throw new Error(`JIT not sufficiently faster: base ${base.perOpUs.toFixed(2)}us vs jit ${jit.perOpUs.toFixed(2)}us`);
}
