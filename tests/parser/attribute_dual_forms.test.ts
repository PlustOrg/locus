import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

describe('dual attribute forms', () => {
  test('paren and annotation produce same AST', () => {
    const src1 = `database { entity User { name: String (unique) email: String (default: "a") } }`;
    const src2 = `database { entity User { name: String @unique email: String @default("a") } }`;
    const ast1 = mergeAsts([parseLocus(src1,'a.locus')]);
    const ast2 = mergeAsts([parseLocus(src2,'b.locus')]);
    const e1 = ast1.database.entities[0];
    const e2 = ast2.database.entities[0];
    expect(e1.fields.map(f=>f.attributes.map(a=>a.kind))).toEqual(e2.fields.map(f=>f.attributes.map(a=>a.kind)));
  });
});
