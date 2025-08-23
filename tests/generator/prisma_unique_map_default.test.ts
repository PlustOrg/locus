import { mergeAsts } from '../../src/parser/merger';
import { generatePrismaSchema } from '../../src/generator/prisma';
import { LocusFileAST } from '../../src/ast';

describe('Prisma attribute generation', () => {
  test('unique, default literal, mapped field name', () => {
    const file: LocusFileAST = {
      databases: [{ type: 'database', entities: [ {
        name: 'Thing',
        fields: [
          { name: 'code', type: { kind: 'primitive', name: 'String' }, attributes: [ { kind: 'unique' } ] },
          { name: 'count', type: { kind: 'primitive', name: 'Integer' }, attributes: [ { kind: 'default', value: 5 } ] },
          { name: 'label', type: { kind: 'primitive', name: 'String' }, attributes: [ { kind: 'map', to: 'label_txt' } ] }
        ],
        relations: []
      } ] }],
      designSystems: [], pages: [], components: [], stores: []
    };
    const merged = mergeAsts([file]);
    const schema = generatePrismaSchema(merged.database);
    expect(schema).toMatch(/code\s+String\s+@unique/);
    expect(schema).toMatch(/count\s+Int\s+@default\(5\)/);
    expect(schema).toMatch(/label\s+String\s+@map\("label_txt"\)/);
  });
});
