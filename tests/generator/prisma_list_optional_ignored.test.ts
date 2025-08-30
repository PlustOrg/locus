import { parseLocus } from '../../src/parser';

describe('Prisma list optional rejected (Phase 1)', () => {
  test('list of String? now parse error', () => {
    const src = 'database { entity Foo { tags: list of String? } }';
    expect(() => parseLocus(src, 't')).toThrow();
  });
});
