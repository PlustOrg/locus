import { generatePrismaSchema } from '../../src/generator/prisma';

describe('Deterministic entity ordering', () => {
  test('schema same regardless of entity declaration order', () => {
    const dbA = { entities: [ { name:'B', fields:[], relations:[] }, { name:'A', fields:[], relations:[] } ] } as any;
    const dbB = { entities: [ { name:'A', fields:[], relations:[] }, { name:'B', fields:[], relations:[] } ] } as any;
    const s1 = generatePrismaSchema(dbA);
    const s2 = generatePrismaSchema(dbB);
    expect(s1).toBe(s2);
  });
});
