import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { generatePrismaSchema } from '../../src/generator/prisma';

function build(src: string) {
  const ast = parseLocus(src, 'test.locus');
  const unified = mergeAsts([ast as any]);
  return generatePrismaSchema(unified.database as any);
}

describe('Prisma generator list of primitive types', () => {
  test('generates String[] and Int[] fields', () => {
    const schema = build(`database { entity Post { tags: list of String counts: list of Integer } }`);
    expect(schema).toMatch(/tags String\[]/);
    expect(schema).toMatch(/counts Int\[]/);
  });
});
