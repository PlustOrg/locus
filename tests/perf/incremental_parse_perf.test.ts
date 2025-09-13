import { parseLocus, __resetParseCount, __getParseCount } from '../../src/parser';

function src(n:number){ return `database { entity E${n} { id: Integer name: String } }`; }

test('incremental parse avoids reparsing unchanged files', () => {
  __resetParseCount();
  const files = Array.from({length:5}, (_,i)=>({path:`f${i}.locus`, content: src(i)}));
  for (const f of files) parseLocus(f.content,f.path);
  const first = __getParseCount();
  // reparse all unchanged
  for (const f of files) parseLocus(f.content,f.path);
  const second = __getParseCount();
  expect(second).toBe(first);
});
