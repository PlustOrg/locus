import fc from 'fast-check';
import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

const primitives = ['String','Text','Integer','Decimal','Boolean','DateTime','Json','BigInt','Float','UUID','Email','URL'];

function buildEntity(fields: Array<{name:string,type:string}>): string {
  const body = fields.map(f=>`${f.name}: ${f.type}`).join(' ');
  return `database { entity T { id: Integer ${body} } }`;
}

describe('property-based: random primitive field declarations parse', () => {
  test('random primitive field sets', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ 
            name: fc.string({minLength:1, maxLength:6})
              .filter(s=>/^[a-z]+$/.test(s))
              .filter(s=>!['length','else','on','in','guard'].includes(s)),
            type: fc.constantFrom(...primitives)
          }),
          {maxLength:5}
        ),
        (fields) => {
          const src = buildEntity(fields);
          const ast:any = mergeAsts([parseLocus(src,'gen.locus')]);
          const ent = ast.database.entities[0];
          for (const f of fields) {
            const found = ent.fields.find((ff:any)=>ff.name===f.name);
            expect(found).toBeTruthy();
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
