import { parseLocus } from '../../src/parser';

describe('relation inverse clause parsing', () => {
  test('has_one with inverse parses', () => {
    const ast = parseLocus('database { entity User { id: Integer posts: has_many Post } entity Post { id: Integer author: has_one User inverse: posts } }','m.locus');
    const db: any = (ast as any).database || (ast as any).databases?.[0];
    const post = db.entities.find((e: any) => e.name === 'Post');
    const rel = post.relations.find((r: any) => r.name === 'author');
    expect(rel.inverse).toBe('posts');
  });
});
