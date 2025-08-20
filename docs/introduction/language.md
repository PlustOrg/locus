# The Locus Language

The Locus language is a declarative language for defining full-stack web applications. It is designed to be simple, expressive, and easy to learn. A Locus application is defined in one or more `.locus` files, which are then compiled into a complete web application.

## Core Concepts

A Locus application is built from a few core concepts:

-   **`database`**: Defines the data models, fields, and relationships for your application.
-   **`page`**: A top-level, routable component.
-   **`component`**: A reusable piece of UI and logic.
-   **`store`**: A block for defining globally accessible state.

## Data Modeling: The `database` Block

The `database` block is used to define your application's data structure. The Locus compiler will discover all `.locus` files in your project, parse every `database` block, and merge their contents into a single, unified schema.

### Entities

An `entity` is a blueprint for a data model, which translates directly to a database table.

```locus
database {
  entity Customer {
    name: String
    email: String (unique)
    subscribedAt: DateTime (default: now())
    isActive: Boolean (default: true)
  }
}
```

### Field Types

| Type      | Description                                     |
| :-------- | :---------------------------------------------- |
| `String`  | For short text, like names, titles, or emails.  |
| `Text`    | For long-form text.                             |
| `Integer` | For whole numbers.                              |
| `Decimal` | For numbers with decimal points.                |
| `Boolean` | For true/false values.                          |
| `DateTime`| For storing specific dates and times.           |
| `Json`    | For storing arbitrary JSON data.                |

### Field Attributes

-   **`?` (Optional Marker)**: Marks a field as optional.
-   **`(unique)`**: Ensures that every value in this column is unique.
-   **`(default: ...)`**: Provides a default value.
-   **`(map: "db_column_name")`**: Specifies a different underlying column name in the database.

### Relationships

-   **One-to-Many**: `orders: has_many Order` and `customer: belongs_to Customer`.
-   **Many-to-Many**: `categories: has_many Category` and `products: has_many Product`.
-   **One-to-One**: Add the `(unique)` attribute to a `belongs_to` field.

## Application Logic: `page`, `component`, and `store`

### `page` and `component` Structure

A `page` or `component` is organized into four main blocks:

1.  **`state`**: Declares the reactive data for the component.
2.  **Lifecycle hooks**: `on load` and `on unload`.
3.  **`action`**: Contains the business logic.
4.  **`ui`**: Declaratively describes the user interface.

```locus
page CustomerList {
  state {
    customers: list of Customer = []
  }

  on load {
    customers = find(Customer)
  }

  action deleteCustomer(customerToDelete: Customer) {
    delete(customerToDelete)
    customers.remove(customerToDelete)
  }

  ui {
    // ...
  }
}
```

### Global State (`store`)

A `store` defines state that is globally accessible.

```locus
store Auth {
  currentUser: User?
  isLoggedIn: false
}
```

### Data Fetching

Locus provides high-level functions for interacting with the database:

-   `find(Entity)`
-   `findOne(Entity, where: { ... })`
-   `create(Entity, { ... })`
-   `update(record, { ... })`
-   `delete(record)`

## UI Syntax

The `ui` block uses an XML-like syntax to describe the user interface.

### Data Binding

Use the `bind:value` directive for two-way data binding on form inputs.

```locus
<TextField placeholder="Enter your name" bind:value={name} />
```

### Event Handling

Use the `on:event` directive to link UI events to actions.

```locus
<Button on:click={increment}>+1</Button>
```

### Control Flow

-   **Conditional Rendering**: `<if>`, `<elseif>`, `<else>`
-   **List Rendering**: `for:each`

```locus
<if condition={status == "loading"}>
  <Spinner />
</if>

<ProductCard for:each={product in products} product={product} />
```
