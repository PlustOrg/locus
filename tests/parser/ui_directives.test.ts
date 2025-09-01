import { parseUi } from '../../src/parser/uiParser';
import { generateReactComponent } from '../../src/generator/react';

describe('UI directive syntax', () => {
  test('{#if}/{:else}/{/if} transforms to AST', () => {
    const ui = `{#if user}{user.name}{:else}Guest{/if}`;
    const ast = parseUi(ui);
    expect(ast).toBeTruthy();
    // top-level becomes element or text wrapper; search for if node
    const findIf = (n:any): any => {
      if (n.type === 'if') return n;
      for (const c of (n.children||[])) { const r = findIf(c); if (r) return r; }
    };    
    const ifNode = findIf(ast);
    expect(ifNode).toBeTruthy();
    expect(ifNode.condition || ifNode.attrs?.condition?.value).toContain('user');
  });

  test('{#each} produces forEach node', () => {
    const ui = `{#each item in items}<span>{item}</span>{/each}`;
    const ast = parseUi(ui);
    const findFE = (n:any): any => {
      if (n.type === 'forEach') return n;
      for (const c of (n.children||[])) { const r = findFE(c); if (r) return r; }
    };
    const fe = findFE(ast);
    expect(fe).toBeTruthy();
    expect(fe.item || fe.attrs?.forEach?.item).toBe('item');
  });

  test('React generation with directives', () => {
    const comp: any = { name: 'DirTest', uiAst: parseUi(`{#if show}<div>Hi</div>{/if}`)};
    const code = generateReactComponent(comp, []);
    expect(code).toContain('show ?');
  });
});
