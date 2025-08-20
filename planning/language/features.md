# Application Logic: `page`, `component`, and `store`

The interactive parts of your application are defined within `.locus` files using `page`, `component`, and `store` blocks. These blocks allow you to bring together state, actions, and UI in a single, cohesive unit.

*   **`page`**: A top-level, routable component. Each `page` you define will be accessible via a URL in your application (e.g., `page CustomerList` might be available at `/customer-list`).
*   **`component`**: A reusable piece of UI and logic that can be used within pages or other components.
*   **`store`**: A block for defining state that is globally accessible across the entire application.

## Structure of a `page` or `component`

A well-structured `page` or `component` is organized into four main blocks, executed in a predictable order:

```locus
// file: customers.locus

// A `page` is a top-level, routable component.
page CustomerList {
  
  // 1. The `state` block declares the reactive data for this page.
  state {
    customers: list of Customer = []
    isLoading: true
    searchText: ""
  }

  // 2. Lifecycle hooks like `on load` run at specific times.
  on load {
    // This code runs once when the page is first loaded.
    customers = find(Customer) // Built-in data fetching
    isLoading = false
  }

  // 3. `action` blocks contain the business logic.
  action deleteCustomer(customerToDelete: Customer) {
    // This code runs when called from the UI.
    delete(customerToDelete)
    customers.remove(customerToDelete) // State updates automatically trigger UI refresh.
  }

  action search() {
    isLoading = true
    customers = find(Customer, where: { name: { contains: searchText } })
    isLoading = false
  }

  // 4. The `ui` block declaratively describes the user interface.
  ui {
    <Stack>
      <Header>Customers</Header>
      <HStack>
        <TextField placeholder="Search by name..." bind:value={searchText} />
        <Button on:click={search}>Search</Button>
      </HStack>
      
      <if condition={isLoading}>
        <Spinner />
      </if>
      <else>
        <Table items={customers}>
          <Column field="name" title="Name" />
          <Column field="email" title="Email" />
          <Column title="Actions">
            // The `item` variable is implicitly available inside a Table/List loop
            <Button on:click={deleteCustomer(item)} color="danger">
              Delete
            </Button>
          </Column>
        </Table>
      </else>
    </Stack>
  }
}
```

## State Management

Locus dramatically simplifies state management by providing a clear distinction between local and global state.

### Local State (`state` block)

The `state` block inside a `page` or `component` is its private, reactive memory. 

*   **Reactivity:** Any change to a state variable will automatically and efficiently re-render the parts of the UI that depend on it.
*   **Declaration:** State is declared with a name, a type, and a default value.
    *   `myString: String = "hello"`
    *   `counter: Integer = 0`
    *   `user: User? = null`
    *   `products: list of Product = []`

### Global State (`store` block)

For state that needs to be shared across the entire application (like the logged-in user's status or a shopping cart), you can define a `store`.

```locus
// file: auth.locus

store Auth {
  currentUser: User?
  isLoggedIn: false
}
```

Any `page` or `component` can then access this global state directly by referencing the store's name:

```locus
// in another .locus file
if Auth.isLoggedIn {
  <Text>Welcome, {Auth.currentUser.name}</Text>
}

action logout() {
  Auth.isLoggedIn = false
  Auth.currentUser = null
}
```

> **Developer Q&A:**
> **Q: How does the reactivity work under the hood?**
> **A:** The Locus compiler transforms the `state` block into a React state management solution (like `useState` or a custom hook). When a state variable is modified, it triggers a re-render of the component, and only the changed parts of the DOM are updated, ensuring high performance.

## Actions and Data Fetching

`action` blocks are where you define your application's logic. They are asynchronous functions that can be called from UI event handlers or other actions.

Locus provides a set of clean, high-level functions for interacting with the database defined in your `database` blocks. These functions are automatically translated by the compiler into secure, type-safe API calls to your backend. You write what looks like direct database access, and Locus handles the client-server communication.

*   **`find(Entity)`**: Fetches all records of an entity.
    *   `allProducts = find(Product)`
*   **`find(Entity, where: { ... })`**: Fetches records matching specific criteria. The query syntax is rich and expressive.
    *   `activeUsers = find(User, where: { isActive: true })`
    *   `recentOrders = find(Order, where: { createdAt: { gte: thirtyDaysAgo } })`
*   **`findOne(Entity, where: { ... })`**: Fetches a single record.
    *   `user = findOne(User, where: { email: "test@example.com" })`
*   **`create(Entity, { ... })`**: Creates a new record.
    *   `create(Product, { name: "New Gadget", price: 99.99 })`
*   **`update(record, { ... })`**: Updates an existing record.
    *   `update(productToUpdate, { price: 129.99 })`
*   **`delete(record)`**: Deletes a record.
    *   `delete(customerToDelete)`


## Lifecycle Hooks

Lifecycle hooks are special actions that run at specific points in a component's life.

*   **`on load`**: This action runs once, after the component has been mounted to the page. It is the ideal place to perform initial data fetching.
*   **`on unload`**: This action runs just before the component is removed from the page. It's useful for cleanup tasks, like clearing subscriptions.

## Parameters (`param`)

Components and pages can accept parameters, allowing you to pass data to them.

```locus
// A reusable component for displaying a user's avatar
component UserAvatar {
  param user: User
  param size: Integer = 48 // with a default value

  ui {
    <Image src={user.avatarUrl} width={size} height={size} />
  }
}

// Used in a page, defined in the same or a different .locus file
page UserProfile {
  state { user: User? }
  on load { user = findOne(User, where: {id: 1}) }
  ui {
    <if condition={user}>
      <UserAvatar user={user} size={64} />
    </if>
  }
}
```
