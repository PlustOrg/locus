import { parseLocus } from '../../src/parser';

describe('Features CST-driven parsing', () => {
  test('page with state, on load, action, and ui', () => {
    const src = `page Home {\n  state {\n    count: Integer = 0\n  }\n  on load {\n    console.log('loaded')\n  }\n  action inc() { count = count + 1 }\n  ui { <div on:click={inc}>{count}</div> }\n}`;
    const ast = parseLocus(src);
    const page = ast.pages.find(p => p.name === 'Home') as any;
    expect(page).toBeTruthy();
    expect(page.state).toEqual([{ name: 'count', type: { kind: 'primitive', name: 'Integer' }, default: '0' }]);
    expect(page.onLoad).toContain("console.log('loaded')");
    expect(page.actions[0].name).toBe('inc');
    expect(page.actions[0].params).toEqual([]);
    expect(page.actions[0].body).toContain('count = count + 1');
    expect(page.uiAst).toBeTruthy();
  });

  test('component params including list, optional, default', () => {
    const src = `component Card {\n  param title: String? = \"Untitled\"\n  param users: list of User\n  ui { <div>{title}</div> }\n}`;
    const ast = parseLocus(src);
    const comp = ast.components.find(c => c.name === 'Card') as any;
    expect(comp).toBeTruthy();
    expect(comp.params).toEqual([
      { name: 'title', type: { kind: 'primitive', name: 'String', optional: true }, default: '"Untitled"' },
      { name: 'users', type: { kind: 'list', of: 'User' }, default: undefined },
    ]);
    expect(comp.uiAst).toBeTruthy();
  });
});
