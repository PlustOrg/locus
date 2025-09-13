import { parseLocus } from '../../src/parser';

const src = 'database { entity A { a: String b: Integer c: UUID d: Email e: URL } }';

test('primitive type codes assigned and stable ordering', ()=> {
  const ast:any = parseLocus(src,'t.locus');
  const entity = ast.databases[0].entities[0];
  const codes = entity.fields.map((f:any)=>[f.type.name, f.type.code]);
  expect(codes).toEqual([
    ['String', 1],
    ['Integer', 3], // Integer code must stay consistent
    ['UUID', 10],
    ['Email', 11],
    ['URL', 12]
  ]);
});
