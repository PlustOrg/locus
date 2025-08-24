import { parseLocus } from '../../src/parser';

describe('Parser token order regression guard', () => {
  test('keyword vs similar identifier distinction', () => {
    const ast = parseLocus('database { entity User { entityx: String name: String } }', 't');
    const ent = ast.databases[0].entities[0];
    const fieldNames = ent.fields.map(f=>f.name).sort();
    expect(fieldNames).toEqual(['entityx','name']);
  });
});
