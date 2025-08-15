import { mergeAsts } from '../../src/parser/merger';
import { generatePrismaSchema } from '../../src/generator/prisma';
import { LocusFileAST } from '../../src/ast';

describe('Prisma schema generation', () => {
  test('maps entities, fields, attributes, and relations', () => {
    const fileA: LocusFileAST = {
      databases: [{ type: 'database', entities: [
        {
          name: 'Customer',
          fields: [
            { name: 'name', type: { kind: 'primitive', name: 'String' }, attributes: [] },
            { name: 'email', type: { kind: 'primitive', name: 'String' }, attributes: [{ kind: 'unique' }] },
            { name: 'isActive', type: { kind: 'primitive', name: 'Boolean' }, attributes: [{ kind: 'default', value: true }] },
            { name: 'joinedAt', type: { kind: 'primitive', name: 'DateTime' }, attributes: [{ kind: 'default', value: { call: 'now', args: [] } }] },
          ],
          relations: [
            { name: 'orders', kind: 'has_many', target: 'Order', attributes: [] },
          ],
        }
      ] }],
      designSystems: [], pages: [], components: [], stores: [],
    };

    const fileB: LocusFileAST = {
      databases: [{ type: 'database', entities: [
        {
          name: 'Order',
          fields: [
            { name: 'total', type: { kind: 'primitive', name: 'Decimal' }, attributes: [] },
          ],
          relations: [
            { name: 'customer', kind: 'belongs_to', target: 'Customer', attributes: [] },
          ],
        }
      ] }],
      designSystems: [], pages: [], components: [], stores: [],
    };

    const merged = mergeAsts([fileA, fileB]);
    const schema = generatePrismaSchema(merged.database);

    expect(schema).toContain('model Customer');
    expect(schema).toContain('model Order');
    // id field present
    expect(schema).toMatch(/id\s+Int\s+@id\s+@default\(autoincrement\(\)\)/);
    // unique
    expect(schema).toMatch(/email\s+String\s+@unique/);
    // default bool
    expect(schema).toMatch(/isActive\s+Boolean\s+@default\(true\)/);
    // default now
    expect(schema).toMatch(/joinedAt\s+DateTime\s+@default\(now\(\)\)/);
    // relations
    expect(schema).toMatch(/orders\s+Order\[\]/);
    expect(schema).toMatch(/customer\s+Customer\s+@relation\(fields: \[customerId\], references: \[id\]\)/);
    expect(schema).toMatch(/customerId\s+Int/);
  });
});
