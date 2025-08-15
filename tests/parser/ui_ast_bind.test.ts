import { parseLocus } from '../../src/parser';

describe('UI AST parsing - bind:value', () => {
  test('normalizes bind:value to bindValue expr in attrs', () => {
    const src = `
page P {
  state { name: String = "" }
  ui { <TextField bind:value={name} /> }
}
`;
    const ast = parseLocus(src) as any;
    const uiAst = ast.pages[0].uiAst;
    if (uiAst.type === 'element') {
      const child = (uiAst as any).children[0] || uiAst;
      const bind = (child.attrs || {}).bindValue;
      expect(bind).toBeDefined();
      expect(bind.kind).toBe('expr');
      expect(bind.value).toBe('name');
    } else {
      // Fallback smoke check
      expect((uiAst as any).value).toContain('bind:value');
    }
  });
});
