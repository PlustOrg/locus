import { validateBodyAgainst } from '../src/runtime/validateRuntime';

const iterations = Number(process.argv[2]) || 20000;
const schema = { entity: 'Bench', fields: [ { name: 'age', type: 'integer', optional: false, min: 0, max: 150 }, { name: 'name', type: 'string', optional: false, lenMin: 1, lenMax: 30 } ] } as any;

let ok = 0; let fail = 0;
const start = Date.now();
for (let i=0;i<iterations;i++) {
  const body: any = { age: i % 151, name: 'u'+(i%1000) };
  const r = validateBodyAgainst(schema, body, 'create');
  if (r.ok) ok++; else fail++;
}
const elapsed = Date.now() - start;
// eslint-disable-next-line no-console
console.log(JSON.stringify({ iterations, ok, fail, elapsedMs: elapsed, perOpUs: (elapsed*1000/iterations).toFixed(2) }));
