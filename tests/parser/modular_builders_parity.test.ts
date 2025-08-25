import { parseLocus } from '../../src/parser';

// Structural smoke test verifying modular builder output shape for mixed content.
describe('Modular builders parity (structure smoke test)', () => {
  test('parses mixed source with database, page (guard), component, store', () => {
    const src = `database { entity User { id: Integer (unique) name: String } }\npage Dashboard (guard: admin) {\n  state { count: Integer = 0 }\n  ui { <div>{count}</div> }\n}\ncomponent Card { param title: String? = \"Untitled\" ui { <div>{title}</div> } }\nstore Counter { value: Integer = 1 }`;
    const ast = parseLocus(src) as any;
    expect(ast.databases.length).toBe(1);
    expect(ast.databases[0].entities[0].name).toBe('User');
    expect(ast.databases[0].entities[0].fields.find((f:any)=>f.name==='id').attributes.some((a:any)=>a.kind==='unique')).toBe(true);
    const page = ast.pages.find((p:any)=>p.name==='Dashboard');
    expect(page.guard.role).toBe('admin');
    expect(page.state[0]).toEqual({ name: 'count', type: { kind: 'primitive', name: 'Integer' }, default: '0' });
    const comp = ast.components.find((c:any)=>c.name==='Card');
    expect((comp.params[0].default || '').startsWith('"Untitled"')).toBe(true);
    const store = ast.stores.find((s:any)=>s.name==='Counter');
    expect(store.state[0].name).toBe('value');
  });
});
