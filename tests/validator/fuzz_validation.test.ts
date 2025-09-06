import { validateBodyAgainst } from '../../src/runtime/validateRuntime';

const schema = { entity: 'Fuzz', fields: [
  { name: 'age', type: 'integer', optional: true, min: 0, max: 200 },
  { name: 'name', type: 'string', optional: true, lenMin: 1, lenMax: 50, pattern: '^[a-z]*$' },
  { name: 'flag', type: 'boolean', optional: true },
] } as any;

function randInt(max:number){ return Math.floor(Math.random()*max); }
function randStr(){
  const len = randInt(60);
  let s='';
  for (let i=0;i<len;i++) s+= String.fromCharCode(97+randInt(26));
  return s;
}

test('fuzz bodies do not crash validator', () => {
  for (let i=0;i<500;i++) {
    const body: any = {};
    if (randInt(2)) body.age = randInt(250) - (randInt(3)===0 ? -5:0);
    if (randInt(2)) body.name = randStr();
    if (randInt(2)) body.flag = [true,false,'true','false','x'][randInt(5)];
    const res = validateBodyAgainst(schema, body, 'create');
    // Only assertion: function returns a structured result
    expect(res).toHaveProperty('ok');
  }
});
