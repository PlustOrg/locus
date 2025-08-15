import { parseLocus } from '../../src/parser';

describe('Features parsing (state, actions, on load, ui)', () => {
  test('parses page with state, on load, action, and ui', () => {
    const src = `
page CustomerList {
  state {
    customers: list of Customer = []
    isLoading: Boolean = true
    searchText: String = ""
  }

  on load {
    customers = find(Customer)
    isLoading = false
  }

  action search() {
    // do search
  }

  ui {
    <Stack><Header>Customers</Header></Stack>
  }
}
`;
    const ast = parseLocus(src);
    expect(ast.pages.length).toBe(1);
    const page: any = ast.pages[0];
    expect(page.name).toBe('CustomerList');
    expect(page.state).toEqual([
      { name: 'customers', type: { kind: 'list', of: 'Customer' }, default: '[]' },
      { name: 'isLoading', type: { kind: 'primitive', name: 'Boolean' }, default: 'true' },
      { name: 'searchText', type: { kind: 'primitive', name: 'String' }, default: '""' },
    ]);
    expect(page.onLoad?.trim()).toContain('customers = find(Customer)');
    expect(page.actions[0].name).toBe('search');
    expect(page.ui?.includes('<Stack>')).toBe(true);
  });

  test('parses component params and ui', () => {
    const src = `
component Card {
  param title: String
  ui { <div>{title}</div> }
}
`;
    const ast = parseLocus(src);
    expect(ast.components.length).toBe(1);
    const comp: any = ast.components[0];
    expect(comp.name).toBe('Card');
    expect(comp.params).toEqual([
      { name: 'title', type: { kind: 'primitive', name: 'String' }, default: undefined },
    ]);
    expect(comp.ui?.includes('{title}')).toBe(true);
  });

  test('parses store variables', () => {
    const src = `
store Auth {
  isLoggedIn: Boolean = false
}
`;
    const ast = parseLocus(src);
    expect(ast.stores.length).toBe(1);
    const store: any = ast.stores[0];
    expect(store.name).toBe('Auth');
    expect(store.state[0]).toEqual({ name: 'isLoggedIn', type: { kind: 'primitive', name: 'Boolean' }, default: 'false' });
  });
});
