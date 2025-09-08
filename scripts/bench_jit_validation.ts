import { validateBodyAgainst } from '../src/runtime/validateRuntime';
import { fastValidate } from '../src/runtime/jitValidator';

const schema: any = { entity: 'Bench', fields: [ { name: 'email', type: 'string', optional: false, email: true }, { name: 'age', type: 'integer', optional: false, min: 0, max: 120 } ] };
const bodyOk = { email: 'u@example.com', age: 30 };

function run(label: string, fn: (b:any)=>void) {
  const N = 10000;
  const t0 = Date.now();
  for (let i=0;i<N;i++) fn(bodyOk);
  const dt = Date.now()-t0;
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ label, ms: dt, perOpUs: (dt*1000/N).toFixed(2) }));
}

run('baseline', b => { validateBodyAgainst(schema, b, 'create'); });
process.env.LOCUS_VALIDATION_JIT='1';
const jitted = (b:any)=> fastValidate(schema, b, 'create');
run('jit', jitted);
