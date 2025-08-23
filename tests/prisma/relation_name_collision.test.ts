import { mergeAsts } from '../../src/parser/merger';
import { generatePrismaSchema } from '../../src/generator/prisma';
import { LocusFileAST } from '../../src/ast';

describe('Prisma relation name collision (sanity)', () => {
  test('two entities referencing each other distinct relation fields', () => {
    const file: LocusFileAST = { databases: [ { type: 'database', entities: [ {
      name: 'A',
      fields: [],
      relations: [ { name: 'bItems', kind: 'has_many', target: 'B', attributes: [] } ]
    }, {
      name: 'B',
      fields: [],
      relations: [ { name: 'aItems', kind: 'has_many', target: 'A', attributes: [] } ]
    } ] } ], designSystems: [], pages: [], components: [], stores: [] };
    const merged = mergeAsts([file]);
    const schema = generatePrismaSchema(merged.database);
    expect(schema).toMatch(/bItems\s+B\[\]/);
    expect(schema).toMatch(/aItems\s+A\[\]/);
  });
});
