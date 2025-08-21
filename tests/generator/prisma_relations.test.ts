import { generatePrismaSchema } from '../../src/generator/prisma';

// Minimal mock entities to exercise relation modeling ordering
const entities = [
  {
    name: 'Post',
    fields: [],
    relations: [ { kind: 'belongs_to', name: 'author', target: 'User' } ]
  },
  {
    name: 'User',
    fields: [],
    relations: [ { kind: 'has_many', name: 'posts', target: 'Post' } ]
  }
] as any;

test('belongs_to places scalar FK before relation field', () => {
  const schema = generatePrismaSchema({ entities });
  const postModel = schema.split(/model Post/)[1];
  expect(postModel).toMatch(/authorId Int[\s\S]*author User @relation/);
});
