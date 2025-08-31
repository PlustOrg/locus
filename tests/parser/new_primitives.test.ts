import { parseLocus } from '../../src/parser';

describe('Phase2 new primitives & nullable', () => {
  test('parses new primitive types and nullable modifier', () => {
    const src = `database { entity Sample { a: BigInt b: Float? c: UUID d: Email nullable e: URL? nullable } }`;
    const ast = parseLocus(src, 'mem.locus');
    expect(ast.databases[0].entities[0].fields.length).toBe(5);
  });
});
