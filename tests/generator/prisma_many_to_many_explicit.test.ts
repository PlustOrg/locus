import { generatePrismaSchema } from '../../src/generator/prisma';
import { mergeAsts } from '../../src/parser/merger';
import { LocusFileAST } from '../../src/ast';

describe('Prisma generator - many-to-many explicit join entity', () => {
  test('explicit join entity with two belongs_to relations', () => {
    const fileA: LocusFileAST = {
      databases: [{ type: 'database', entities: [
        { name: 'User', fields: [], relations: [ { name: 'userRoles', kind: 'has_many', target: 'UserRole', attributes: [] } ] },
        { name: 'Role', fields: [], relations: [ { name: 'userRoles', kind: 'has_many', target: 'UserRole', attributes: [] } ] },
        { name: 'UserRole', fields: [], relations: [
          { name: 'user', kind: 'belongs_to', target: 'User', attributes: [] },
          { name: 'role', kind: 'belongs_to', target: 'Role', attributes: [] },
        ]},
      ] }],
      designSystems: [], pages: [], components: [], stores: [],
    };

    const merged = mergeAsts([fileA]);
    const schema = generatePrismaSchema(merged.database);

    expect(schema).toContain('model User');
    expect(schema).toContain('model Role');
    expect(schema).toContain('model UserRole');
    // Join entity has two belongs_to with scalar FKs
    expect(schema).toMatch(/user\s+User\s+@relation\(fields: \[userId\], references: \[id\]\)/);
    expect(schema).toMatch(/userId\s+Int/);
    expect(schema).toMatch(/role\s+Role\s+@relation\(fields: \[roleId\], references: \[id\]\)/);
    expect(schema).toMatch(/roleId\s+Int/);
    // Parent sides are has_many to the join
    expect(schema).toMatch(/userRoles\s+UserRole\[\]/);
  });
});
