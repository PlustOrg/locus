# Application Logic in Locus

Locus lets you define interactive features using `page`, `component`, and `store` blocks. These blocks co-locate state, actions, and UI, making your code easy to reason about and maintain.

## Pages and Components

- **`page`**: Routable top-level feature (e.g., `/dashboard`).
- **`component`**: Reusable UI and logic.

Each block contains:
1. `state` (reactive data)
2. Lifecycle hooks (`on load`, `on unload`)
3. `action` (business logic)
4. `ui` (declarative interface)

```locus
page CustomerList {
  state {
    customers: list of Customer = []
    isLoading: true
  }
  on load {
    customers = find(Customer)
    isLoading = false
  }
  action deleteCustomer(customer: Customer) {
    delete(customer)
    customers.remove(customer)
  }
  ui {
    <Stack>
      <Header>Customers</Header>
      <Button on:click={refresh}>Refresh</Button>
      <Table items={customers} />
    </Stack>
  }
}
```

## State Management

- **Local State:** Defined in `state` blocks, reactive within the page/component.
- **Global State:** Defined in `store` blocks, accessible everywhere.

```locus
store Auth {
  currentUser: User?
  isLoggedIn: false
}
```

## Actions and Data Fetching

Actions are async functions called from UI events or other actions. Locus provides built-in data access functions:
- `find(Entity)`
- `findOne(Entity, where: { ... })`
- `create(Entity, { ... })`
- `update(record, { ... })`
- `delete(record)`

## Lifecycle Hooks

- `on load`: Runs when the page/component mounts.
- `on unload`: Runs before unmounting.

## Parameters

Components/pages can accept parameters for customization:

```locus
component UserAvatar {
  param user: User
  param size: Integer = 48
  ui {
    <Image src={user.avatarUrl} width={size} height={size} />
  }
}
```

See [UI Syntax](./ui-syntax.md) for more on building interfaces.
