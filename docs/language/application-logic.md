# Application Logic Reference

The "brains" of your Locus application are defined within `page` and `store` blocks. This is where you declare your data, handle user interactions, and manage the logic that makes your application interactive.

## Pages vs. Stores
Locus has two main places to define application logic:

-   **`page`**: Contains the state and logic for a single, routable screen in your application. State defined in a page is **local** to that page.
-   **`store`**: Contains state and logic that needs to be **global**—accessible from any page or component in your entire application. This is perfect for things like user authentication status or shopping cart data.

Both `page` and `store` blocks are structured similarly, using `state` and `action` blocks.

## The `state` Block
The `state` block is where you define the reactive data for your page or store. Every variable you declare here is automatically wired up to the UI. When you change a state variable, any part of the UI that uses it will automatically re-render.

```locus
state {
  // A simple counter, starting at 0
  count: Integer = 0

  // A boolean flag
  isLoading: Boolean = true

  // A list of data models, initialized as an empty list
  customers: list of Customer = []
}
```
> **How it works:** Under the hood, each state variable is powered by a React `useState` hook. This is important for understanding how to modify state.

## Modifying State
You **cannot** modify a state variable directly (e.g., `count = count + 1`). Instead, for every state variable you declare, Locus automatically provides you with a **setter function**.

The rule is simple: for a state variable named `myVar`, the setter function is named `setMyVar`.

```locus
state {
  count: Integer = 0
}

action increment() {
  // CORRECT: Use the setter function
  setCount(count + 1)

  // INCORRECT: This will not work
  // count = count + 1
}
```
This is the most important concept in Locus application logic. Always use the setter function to change state.

## The `on load` Hook
The `on load` block contains code that runs exactly once, right after the page has been loaded and is ready. It's the perfect place to fetch initial data from your database.

```locus
state {
  products: list of Product = []
}

// Fetch all products as soon as the page loads
on load {
  const allProducts = find(Product)
  setProducts(allProducts)
}
```
> **How it works:** The `on load` block is implemented as a React `useEffect` hook with an empty dependency array (`[]`), which ensures it only runs on the initial mount.

## The `action` Block
Actions are functions that contain your business logic. You can call them from the UI (e.g., `on:click`) or from other actions.

### Defining Actions
```locus
action myAction() {
  // logic goes here
  log("Action executed!")
}
```

### Actions with Parameters
Actions can accept parameters, which you can provide when calling them from the UI.

```locus
action greet(name: String) {
  log("Hello, " + name)
}

ui {
  <Button on:click={greet("World")}>Greet</Button>
}
```

### Async Actions and Data
Actions are asynchronous by default, so you can use `await` when calling functions that return promises, like the built-in database functions.

```locus
action createProduct(name: String, price: Decimal) {
  const newProduct = await create(Product, {
    name: name,
    price: price
  })
  // Add the new product to our local state list
  addProduct(newProduct)
}
```

## Built-in Database Functions
Locus provides a set of simple, powerful functions for interacting with your database from within `on load` or `action` blocks.

-   **`find(Entity)`**: Fetches all records of a given entity.
    ```locus
    const allUsers = await find(User)
    ```
-   **`findOne(Entity, where: { ... })`**: Finds a single record that matches the `where` clause.
    ```locus
    const admin = await findOne(User, where: { email: "admin@example.com" })
    ```
-   **`create(Entity, { ... })`**: Creates a new record.
    ```locus
    const newUser = await create(User, { name: "Alice", email: "alice@example.com" })
    ```
-   **`update(record, { ... })`**: Updates an existing record.
    ```locus
    await update(user, { name: "Alice Smith" })
    ```
-   **`delete(record)`**: Deletes an existing record.
    ```locus
    await delete(user)
    ```
