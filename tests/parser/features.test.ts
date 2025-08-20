import { parseLocus } from '../../src/parser';
import { LocusFileAST } from '../../src/ast';

describe('Parser: page, component, store, and ui', () => {
  test('page with state, on load, actions, and ui', () => {
    const src = `
      page CustomerList {
        state { customers: list of Customer = [] isLoading: true searchText: "" }
        on load { customers = find(Customer) isLoading = false }
        action search() { isLoading = true isLoading = false }
        ui {
          <Stack>
            <Header>Customers</Header>
            <HStack>
              <TextField placeholder="Search" bind:value={searchText} />
              <Button on:click={search}>Search</Button>
            </HStack>
          </Stack>
        }
      }
    `;
    const ast = parseLocus(src) as LocusFileAST;
    expect(ast.pages).toHaveLength(1);
    expect(ast.pages[0].name).toBe('CustomerList');
  });

  test('component with params', () => {
    const src = `
      component UserAvatar {
        param user: User
        param size: Integer = 48
        ui { <Image src={user.avatarUrl} width={size} height={size} /> }
      }
    `;
    const ast = parseLocus(src) as LocusFileAST;
    expect(ast.components).toHaveLength(1);
    expect(ast.components[0].name).toBe('UserAvatar');
  });

  test('store with state variables', () => {
    const src = `
      store Auth { currentUser: User? isLoggedIn: false }
    `;
    const ast = parseLocus(src) as LocusFileAST;
    expect(ast.stores).toHaveLength(1);
    expect(ast.stores[0].name).toBe('Auth');
  });
});
