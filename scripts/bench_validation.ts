import { validateBodyAgainst } from '../src/runtime/validateRuntime';

function randomString(len: number) { return Array.from({length: len}, () => String.fromCharCode(97+Math.floor(Math.random()*26))).join(''); }

const schema = {
  entity: 'Bench',
  fields: [
    { name: 'age', type: 'integer', optional: false, min: 0, max: 120 },
    { name: 'name', type: 'string', optional: false, lenMin: 3, lenMax: 40, pattern: '^[a-z]+$' },
    { name: 'email', type: 'string', optional: false, email: true },
    { name: 'tags', type: 'string', optional: true, list: true },
  ]
};

function genValid(i:number){
  return { age: (i%121), name: randomString(10), email: `user${i}@example.com`, tags: ['a','b','c'] };
}

const iterations = Number(process.argv[2]) || 5000;
const start = Date.now();
let failures = 0;
for (let i=0;i<iterations;i++) {
  const body = genValid(i);
  const res = validateBodyAgainst(schema as any, body, 'create');
  if (!res.ok) failures++;
}
const elapsed = Date.now() - start;
// eslint-disable-next-line no-console
console.log(JSON.stringify({ iterations, elapsedMs: elapsed, avgPerOpMs: elapsed/iterations, failures }));
