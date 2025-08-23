import { mergeAsts } from '../../src/parser/merger';
import { generatePrismaSchema } from '../../src/generator/prisma';
import { LocusFileAST } from '../../src/ast';

describe('Prisma optional belongs_to (nullable FK)', () => {
  test('belongs_to with optional scalar field', () => {
    const file: LocusFileAST = { databases: [ { type: 'database', entities: [ {
      name: 'Note',
      fields: [ { name: 'authorId', type: { kind: 'primitive', name: 'Integer', optional: true }, attributes: [] } ],
      relations: [ { name: 'author', kind: 'belongs_to', target: 'User', attributes: [] } ]
    } ] } ], designSystems: [], pages: [], components: [], stores: [] };
    const merged = mergeAsts([file]);
    const schema = generatePrismaSchema(merged.database);
    expect(schema).toMatch(/authorId\s+Int\?/);
  });
});
