import { parseLocus } from '../../src/parser';

// Simple fuzz: generate random combinations of primitive fields
const PRIMS = ['String','Text','Integer','Decimal','Boolean','DateTime','Json'];

function rand(n:number){return Math.floor(Math.random()*n);} // not seeded; sufficient for smoke

function genEntity(i:number){
  const fieldCount = 1 + rand(5);
  const lines:string[] = [];
  for(let f=0; f<fieldCount; f++){
    const name = 'f'+f;
    const prim = PRIMS[rand(PRIMS.length)];
    const optional = Math.random()<0.3 ? '?' : '';
    lines.push(`${name}: ${prim}${optional}`);
  }
  return `entity E${i} {\n  ${lines.join('\n  ')}\n}`;
}

describe('Fuzz: entity field parsing', () => {
  test('random entities parse', () => {
    const entities:string[] = [];
    for(let i=0;i<25;i++) entities.push(genEntity(i));
    const src = `database {\n${entities.join('\n')}\n}`;
    const ast = parseLocus(src);
    expect(ast.databases[0].entities.length).toBeGreaterThan(0);
  });
});
