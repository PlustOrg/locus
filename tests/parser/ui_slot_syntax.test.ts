import { parseUi } from '../../src/parser/uiParser';

describe('UI slot syntax', () => {
  test('parses named slot element', () => {
    const ast: any = parseUi('<div><slot name="header"/><slot name="footer"/></div>');
    const div = ast;
    expect(div.children.some((c:any)=>c.type==='slot' && c.name==='header')).toBe(true);
    expect(div.children.some((c:any)=>c.type==='slot' && c.name==='footer')).toBe(true);
  });
  test('default slot emits default name', () => {
    const ast: any = parseUi('<slot />');
    expect(ast.type).toBe('slot');
    expect(ast.name).toBe('default');
  });
});
