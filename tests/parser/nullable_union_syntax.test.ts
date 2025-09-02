import { parseLocus } from '../../src/parser';

describe('nullable union syntax', () => {
  test('parses primitive nullable with | Null', () => {
  const ast = parseLocus('database { entity A { value: String | Null } }','file.locus');
  const ent = (ast as any).databases[0].entities[0];
    const field = ent.fields.find((f:any)=>f.name==='value');
    expect(field.type.kind).toBe('primitive');
    expect(field.type.nullable).toBe(true);
  });
});
