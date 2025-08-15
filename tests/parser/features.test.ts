import { parseLocus, LocusParserError } from '../../src/parser';

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
    expect(() => parseLocus(src)).toThrow(LocusParserError);
  });

  test('component with params', () => {
    const src = `
      component UserAvatar {
        param user: User
        param size: Integer = 48
        ui { <Image src={user.avatarUrl} width={size} height={size} /> }
      }
    `;
    expect(() => parseLocus(src)).toThrow(LocusParserError);
  });

  test('store with state variables', () => {
    const src = `
      store Auth { currentUser: User? isLoggedIn: false }
    `;
    expect(() => parseLocus(src)).toThrow(LocusParserError);
  });
});
