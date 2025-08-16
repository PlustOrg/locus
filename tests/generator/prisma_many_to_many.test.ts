import { generatePrismaSchema } from '../../src/generator/prisma';
import { mergeAsts } from '../../src/parser/merger';
import { LocusFileAST } from '../../src/ast';

describe('Prisma generator - many-to-many', () => {
  test('implicit many-to-many via has_many on both sides', () => {
    const fileA: LocusFileAST = {
      databases: [{ type: 'database', entities: [
        { name: 'User', fields: [], relations: [ { name: 'roles', kind: 'has_many', target: 'Role', attributes: [] } ] },
      ] }],
      designSystems: [], pages: [], components: [], stores: [],
    };
    const fileB: LocusFileAST = {
      databases: [{ type: 'database', entities: [
        { name: 'Role', fields: [], relations: [ { name: 'users', kind: 'has_many', target: 'User', attributes: [] } ] },
      ] }],
      designSystems: [], pages: [], components: [], stores: [],
    };
    const merged = mergeAsts([fileA, fileB]);
    const schema = generatePrismaSchema(merged.database);
    expect(schema).toContain('model User');
    expect(schema).toContain('model Role');
    // Arrays on both sides, no foreign key scalars
    expect(schema).toMatch(/roles\s+Role\[\]/);
    expect(schema).toMatch(/users\s+User\[\]/);
    expect(schema).not.toMatch(/rolesId|usersId/);
  });
});
