import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

test('Type[] shorthand parses as list of Type with deprecation warning', () => {
  const ast:any = mergeAsts([parseLocus('database { entity User { tags: String[] } }','db.locus')]);
  const ent = (ast as any).database.entities[0];
  const field = ent.fields.find((f:any)=>f.name==='tags');
  expect(field.type.kind).toBe('list');
});
