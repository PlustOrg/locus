# Locus: The Language and Toolchain for Focused Web Development

## A Reference Document & Manifesto

**Version 0.1.0**

---

## Introduction: Reclaiming Focus in a Complex World

Modern web development is a marvel of engineering, but for many, it has become a labyrinth of complexity. Building even a simple application for a small or medium-sized business can require orchestrating dozens of tools, libraries, and frameworks. Developers—especially those in small teams or working solo—spend an inordinate amount of time on configuration, boilerplate, and wrestling with the "accidental complexity" of gluing disparate systems together, rather than solving real business problems.

**Locus is the antidote.**

Locus is a domain-specific language (DSL) and a fully integrated toolchain designed for one purpose: to be the fastest, clearest, and most enjoyable way to build robust, maintainable, small-to-medium-sized web applications.

It is built for the **"Full-Stack Creator"**: the pragmatic developer, the technical founder, the freelance professional who needs to translate a vision into a working product with maximum velocity and minimum friction. Locus achieves this by embracing a philosophy of "convention over configuration" to its logical extreme, providing a single, declarative language to define an entire full-stack application.

This document serves as the foundational reference for the Locus language, its design system, its powerful `locus` command-line interface, and its extensible architecture.

---

## Part 1: The Locus Philosophy

Every decision in Locus is guided by a core set of principles. Understanding this philosophy is key to understanding the language itself.

### The Three Pillars

1.  **Velocity:** The primary goal is to drastically shorten the time from idea to deployed application. This is achieved by eliminating boilerplate, automating common patterns, and providing a seamless, "it just works" development environment. A single developer using Locus should be as productive as a small team using conventional tools.
2.  **Clarity:** Locus code is declarative and highly readable. The syntax is designed to describe *what* the application does, not *how* it does it. By co-locating related state, logic, and UI, Locus files become a single source of truth for a feature, making them remarkably easy to understand and reason about.
3.  **Maintainability:** Applications built for businesses have long lifespans. Locus promotes long-term health by generating code that is clean, well-structured, and based on stable, industry-standard technologies. It provides clear "escape hatches" for custom code, ensuring the system never imposes a hard limit on what's possible.

### What Locus Is Not (Our Non-Goals)

To excel at its specific purpose, Locus deliberately avoids being a one-size-fits-all solution.

*   **It is not a general-purpose language:** You will not write an operating system or a game engine in Locus. Its domain is strictly web applications.
*   **It is not for hyperscale, FAANG-level applications:** The architectural trade-offs are optimized for the needs of SMEs, not for services handling hundreds of millions of concurrent users.
*   **It is not a "No-Code" platform:** Locus is a text-based, code-driven tool for people comfortable with logic. It prioritizes the power and precision of code over the limitations of a drag-and-drop interface.
*   **It is not a replacement for CSS or a UI design tool:** It provides a structured way to build and theme UIs, but it works with, rather than replaces, standard web styling technologies for deep customization.

---

## Part 2: The Locus Language Specification

The Locus language is organized into a clear file structure that separates the application's data foundation from its interactive features.

*   **`.entities` files:** Define the data models, fields, and relationships. Typically, a project has one primary `database.entities` file.
*   **`.feature` files:** Define the pages, components, state, and logic of the application.

### Data Modeling: The `.entities` File

This file is the single source of truth for your application's data structure. The Locus compiler uses it to generate database schemas, migrations, and a complete, type-safe data API.

#### **Entities**
An `entity` is a blueprint for a data model, which translates directly to a database table.

```locus
// file: database.entities

entity Customer {
  name: String
  email: String (unique)
  subscribedAt: DateTime (default: now())
  isActive: Boolean (default: true)
}

entity Product {
  sku: String (unique)
  description: Text
  price: Decimal
  stock: Integer
  imageUrl: String? // The '?' denotes an optional field
}
```

#### **Field Types**
Locus provides a core set of intuitive data types:

*   `String`: For short text, like names or titles.
*   `Text`: For long-form text.
*   `Integer`: For whole numbers.
*   `Decimal`: For numbers with decimal points, ideal for currency.
*   `Boolean`: For true/false values.
*   `DateTime`: For storing specific dates and times.

#### **Attributes**
Attributes are modifiers that provide constraints and special properties to fields.

*   `(unique)`: Ensures that every value in this column is unique across all records.
*   `(default: ...)`: Provides a default value if one is not specified. Common defaults include `now()` for `DateTime` and `true`/`false` for `Boolean`.
*   `?` (Optional Marker): Placing a `?` after a type name marks the field as optional (nullable in the database).

#### **Relationships**
Defining how entities relate to each other is a core strength of Locus, using plain English keywords.

*   **One-to-Many (`has_many` / `belongs_to`)**

    ```locus
    entity Customer {
      // ... fields
      orders: has_many Order // A customer can have many orders
    }

    entity Order {
      // ... fields
      customer: belongs_to Customer // An order belongs to one customer
    }
    ```

*   **Many-to-Many**
    A many-to-many relationship is declared by placing a `has_many` on both sides. The Locus compiler will automatically generate the required join table in the background.

    ```locus
    entity Product {
      // ... fields
      categories: has_many Category
    }

    entity Category {
      name: String
      products: has_many Product
    }
    ```

### Application Logic: The `.feature` File

A `.feature` file is a self-contained module that describes a piece of your application's user interface and its corresponding logic. It holds everything needed for a feature to work.

A `.feature` file can contain `page` and `component` definitions.

#### **Structure of a `.feature` File**

```locus
// file: customers.feature

// A `page` is a top-level, routable component.
page CustomerList {
  
  // 1. The `state` block declares the reactive data for this page.
  state {
    customers: list of Customer = []
    isLoading: true
  }

  // 2. Lifecycle hooks like `on load` run at specific times.
  on load {
    customers = find(Customer) // Built-in data fetching
    isLoading = false
  }

  // 3. `action` blocks contain the business logic.
  action deleteCustomer(customerToDelete: Customer) {
    delete(customerToDelete)
    customers.remove(customerToDelete)
  }

  // 4. The `ui` block declaratively describes the user interface.
  ui {
    <Stack>
      <Header>Customers</Header>
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

#### **State Management**
Locus simplifies state management dramatically.

*   **Local State:** The `state` block inside a page or component is its private, reactive memory. Any change to a state variable will automatically and efficiently update the UI.
*   **Global State (`store`):** For state that needs to be shared across the entire application (like the logged-in user), you can define a `store`.

    ```locus
    // file: auth.store

    store Auth {
      currentUser: User?
      isLoggedIn: false
    }
    ```
    Any `.feature` file can then access this global state directly by calling `Auth.currentUser`.

#### **Actions and Data Fetching**
`action` blocks are where you define your application's logic. Locus provides a set of clean, high-level functions for interacting with the database. These functions are automatically translated into secure API calls to your backend.

*   `find(Entity)`: Fetches all records of an entity.
*   `find(Entity, where: { ... })`: Fetches records matching specific criteria.
*   `create(Entity, { ... })`: Creates a new record.
*   `update(Entity, { ... })`: Updates an existing record.
*   `delete(Entity)`: Deletes a record.

#### **The UI Block**
The `ui` block uses a familiar, HTML-like tag syntax to describe the user interface.

*   **Data Binding:** Two-way data binding is achieved with `bind:value`.
    `<TextField placeholder="Search..." bind:value={searchText} />`
*   **Event Handling:** UI events are linked to actions with `on:event`.
    `<Button on:click={searchCustomers}>Search</Button>`
*   **Control Flow:**
    *   Conditional rendering is handled with `<if>`, `<elseif>`, and `<else>` blocks.
    *   Looping is handled with the `for:each` attribute: `<ProjectCard for:each={project in projects} />`

---

## Part 3: The Locus Design System

Locus integrates a design system directly into its workflow, separating a component's structure from its visual style. This allows for rapid theming and consistent branding across an entire application.

### The `design.system` File

This central file defines all the visual properties of your application using **design tokens**.

```locus
// file: design.system

colors {
  light {
    primary: "#007bff"
    background: "#f8f9fa"
    text: "#212529"
    danger: "#dc3545"
  }
  dark {
    primary: "#0a84ff"
    background: "#121212"
    text: "#e0e0e0"
    danger: "#ff453a"
  }
}

typography {
  fontFamily: "Inter, sans-serif"
  baseSize: "16px"
}

spacing {
  sm: "0.5rem"  // 8px
  md: "1rem"    // 16px
  lg: "1.5rem"  // 24px
}

radii {
  md: "0.3rem"
}
```

### The Built-in Component Library

Locus provides a core set of unstyled, structural components. Their entire look and feel are derived from the tokens in `design.system`.

*   **Layout:** `<Stack>`, `<Grid>`, `<HStack>` (Horizontal Stack)
*   **Primitives:** `<Button>`, `<TextField>`, `<Checkbox>`, `<Header>`, `<Text>`
*   **Complex Components:** `<Table>`, `<Card>`, `<Modal>`, `<Spinner>`

When the compiler builds your app, it generates a CSS file with all your design tokens defined as CSS Custom Properties, giving you a powerful, modern, and easily customizable styling foundation.

### Style Extensibility

For one-off customizations, you can use style props (`<Button color="danger">`) or the `style:override` block for writing raw, scoped CSS while still having access to your design tokens.

---

## Part 4: The `locus` Toolchain & Developer Experience

A language is only as good as its tools. The Locus ecosystem is managed by a single, powerful, `cargo`-like command-line interface: `locus`.

### The Transformation Engine

The `locus` CLI is powered by a sophisticated **source-to-source generator**. It parses your Locus code and compiles it into a standard, high-quality, full-stack TypeScript project.

*   **Target Architecture:**
    *   **Frontend:** **React** with the **Next.js** meta-framework.
    *   **Backend:** **Node.js** with **Express**.
    *   **Database ORM:** **Prisma**.
    *   **Database:** **PostgreSQL**.

This architecture was chosen to leverage the largest and most mature ecosystems in web development, ensuring the generated code is robust, performant, and easy for any developer to understand if they need to "eject" and work with the raw output.

### The `locus` CLI: Your Development Hub

`locus` is the only command you need to learn. It handles the entire application lifecycle.

*   **`locus new <project_name>`**: Scaffolds a new Locus project with the correct directory structure and a `Locus.toml` configuration file.
*   **`locus dev`**: The most-used command. It starts a unified development server with hot-reloading for both frontend and backend. Changes to your `.feature` files are reflected in your browser instantly.
*   **`locus build`**: Compiles your Locus project into an optimized, production-ready artifact.
*   **`locus test`**: Discovers and runs all tests defined in the `tests { ... }` blocks within your `.feature` files, providing a seamless and co-located testing experience.
*   **`locus db migrate '<name>'`**: A crucial command for safe database schema evolution. It compares your `.entities` file to the database state and generates and applies the necessary SQL migration.
*   **`locus db studio`**: Launches a powerful, web-based GUI to view and edit the data in your development database.
*   **`locus deploy`**: A zero-configuration deployment command. Based on your `Locus.toml` file, it builds and deploys your entire application (frontend, backend, and database) to modern hosting platforms like Vercel and Supabase.
*   **`locus add <package>`**: The escape hatch for adding custom functionality. It intelligently installs an `npm` package into either the generated frontend or backend project.

### Debugging and Testing

*   **Source Maps:** Debugging in the browser's DevTools happens directly within your original Locus source code, not the compiled JavaScript, providing a transparent and intuitive experience.
*   **Co-located Tests:** By defining tests right next to the code they cover, Locus encourages a healthy testing culture and makes maintenance easier.

### Extensibility: The Locus Plugin Ecosystem

To prevent the "glass ceiling" of closed systems, `locus` is built to be extended.

#### **TypeScript Plugins (Deep Integration)**

For complex integrations, developers can write plugins in TypeScript. These plugins can hook into the `locus` CLI and compilation process to:
*   Add new CLI commands (e.g., `locus stripe setup`).
*   Add custom API endpoints to the backend (e.g., for handling webhooks).
*   Provide new UI components to be used in `.feature` files (e.g., `<StripeCheckoutButton>`).

This allows the community to build and share powerful integrations for third-party services like payment gateways, email providers, and more.

#### **Blueprint Plugins (Shareable Features)**

Blueprints are a simpler type of plugin written in Locus itself. They are shareable templates for common features. With a single command (`locus generate blog`), a developer can stamp out a complete, pre-built feature—like a blog, user authentication, or a settings page—directly into their project. The generated Locus code is then fully editable and customizable.

---

## Conclusion: The Future is Focused

Locus represents a deliberate step away from the incidental complexity that has come to dominate web development. It is an opinionated tool, but those opinions are forged from decades of experience and are laser-focused on the goal of empowering individual developers and small teams to build better software, faster.

By providing a single language for data, logic, and UI, a powerful and integrated toolchain, and a clear path for extensibility, Locus allows developers to remain in a state of flow, turning ideas into reality with unparalleled **Velocity**, **Clarity**, and **Maintainability**.