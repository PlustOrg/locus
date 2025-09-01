import { parseLocus } from '../../src/parser';

describe('Structured stateDecl parsing', () => {
  test('parses state block with declarations', () => {
    const src = `page P { state { count: Integer = 0 title: String = "hi" } action do() {} ui { <div/> } }`;
    const ast = parseLocus(src, 'file.locus');
    const page = ast.pages[0];
    expect(page.state).toEqual([
      { name: 'count', type: { kind: 'primitive', name: 'Integer' }, default: '0' },
      { name: 'title', type: { kind: 'primitive', name: 'String' }, default: '"hi"' },
    ]);
  });
});