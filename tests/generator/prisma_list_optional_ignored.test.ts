import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { generatePrismaSchema } from '../../src/generator/prisma';

describe('Prisma list optional ignored', () => {
  test('list of String? yields String[] (no ?)', () => {
    const src = 'database { entity Foo { tags: list of String? } }';
    const ast = parseLocus(src, 't');
    const unified = mergeAsts([ast as any]);
    const schema = generatePrismaSchema(unified.database as any);
    expect(schema).toMatch(/tags String\[]/);
    expect(schema).not.toMatch(/tags String\[]\?/);
  });
});
