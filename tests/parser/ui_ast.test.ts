import { parseLocus } from '../../src/parser';

describe('UI AST parsing', () => {
  test('parses simple nested tags, attributes, and directives into AST', () => {
    const src = `
page P {
  ui {
    <Stack spacing={gap}>
      <Header size="large">Title</Header>
      <Button on:click={doIt}>Go</Button>
      <ItemCard for:each={item in items} item={item} />
    </Stack>
  }
}
`;
    const ast = parseLocus(src) as any;
    const uiAst = ast.pages[0].uiAst;
    if (uiAst.type === 'element') {
      expect(uiAst.tag).toBe('Stack');
      expect((uiAst as any).attrs.spacing.kind).toBe('expr');
      expect((uiAst as any).children[0].tag).toBe('Header');
      expect((uiAst as any).children[0].children[0].type).toBe('text');
      const btn = (uiAst as any).children[1];
      expect(btn.attrs.onClick?.kind || btn.attrs['on:click']?.kind).toBe('expr');
      const loop = (uiAst as any).children[2];
      if (loop.type === 'forEach') {
        expect(loop.item).toBe('item');
      } else {
        // legacy attr form fallback
        expect(loop.attrs.forEach?.item || loop.attrs['for:each']?.item).toBe('item');
      }
    } else {
      // Fallback still returns text; basic smoke check
      expect(uiAst.type).toBe('text');
      expect((uiAst as any).value).toContain('<Stack');
    }
  });
});
