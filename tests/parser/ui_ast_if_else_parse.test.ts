import { parseLocus } from '../../src/parser';

describe('UI AST parsing - if/elseif/else structured nodes', () => {
  test('collapses sibling if/elseif/else into IfNode', () => {
    const src = `
page P {
  ui {
    <div>
      <if condition={a}>
        <A />
      </if>
      <elseif condition={b}>
        <B />
      </elseif>
      <else>
        <C />
      </else>
    </div>
  }
}
`;
    const ast = parseLocus(src) as any;
    const root = ast.pages[0].uiAst;
    if (root.type !== 'element') throw new Error('expected element root');
    const condNode = root.children.find((c: any) => c.type === 'if');
    expect(condNode).toBeDefined();
    expect(condNode.condition).toBe('a');
    expect(Array.isArray(condNode.elif)).toBe(true);
    expect(condNode.elif[0].condition).toBe('b');
    expect(Array.isArray(condNode.else)).toBe(true);
  });
});
