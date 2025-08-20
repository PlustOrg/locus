# The `locus` Toolchain: CLI Commands

A language is only as good as its tools. The Locus ecosystem is managed by a single, powerful, `cargo`-like command-line interface: `locus`. It is the central hub for managing the entire lifecycle of your application, from project creation to deployment.

## Core Philosophy

The `locus` CLI is designed to be:
*   **Unified:** A single command to learn, with intuitive subcommands.
*   **Zero-Configuration:** Most commands work out of the box with sensible defaults.
*   **Powerful:** Provides access to a sophisticated source-to-source generator, database management tools, and deployment pipelines.

## The Transformation Engine

The `locus` CLI is powered by a sophisticated **source-to-source generator**. It parses all your `.locus` files (reading `database`, `page`, `component`, `store`, and `design_system` blocks) and compiles them into a standard, high-quality, full-stack TypeScript project.

*   **Target Architecture:**
    *   **Frontend:** **React** with the **Next.js** meta-framework.
    *   **Backend:** **Node.js** with **Express**.
    *   **Database ORM:** **Prisma**.
    *   **Database:** **PostgreSQL**.

This architecture was chosen to leverage the largest and most mature ecosystems in web development, ensuring the generated code is robust, performant, and easy for any developer to understand if they need to "eject" and work with the raw output.

## Command Reference

Here is a comprehensive list of all available `locus` commands.

---

### `locus new <project_name>`

Scaffolds a new Locus project with the correct directory structure and a default `Locus.toml` configuration file.

*   **Usage:** `locus new my-awesome-app`
*   **What it does:**
    *   Creates a new directory named `my-awesome-app`.
    *   Generates a `Locus.toml` file.
    *   Creates initial `database.locus`, `app.locus`, and `theme.locus` files with boilerplate to get you started.
    *   Initializes a new Git repository.

---

### `locus dev`

The most-used command. It starts a unified development server that watches for changes in your `.locus` files and provides hot-reloading for both the frontend and backend.

*   **Usage:** `locus dev`
*   **What it does:**
    *   Performs an initial compilation of your Locus code into the target TypeScript project (in a hidden `.locus/generated` directory).
    *   Starts the Next.js frontend development server.
    *   Starts the Express backend development server.
    *   Watches all `.locus` files for changes.
    *   When a file is changed, it performs an incremental re-compilation and hot-reloads the relevant part of the application. Changes are reflected in your browser instantly.

---

### `locus build`

Compiles and optimizes your Locus project into a production-ready artifact.

*   **Usage:** `locus build`
*   **What it does:**
    *   Performs a full, optimized compilation of your Locus code.
    *   Runs the production build process for the Next.js frontend.
    *   Runs the production build process for the TypeScript backend.
    *   The output is a self-contained build folder, ready for deployment.

---

### `locus db migrate '<name>'`

A crucial command for safe database schema evolution. It compares the schema derived from all your `database` blocks to the current database state and generates and applies the necessary SQL migration. This command is a wrapper around Prisma's powerful migration system.

*   **Usage:** `locus db migrate 'add-product-sku'`
*   **What it does:**
    *   Analyzes all `database` blocks to build a complete picture of your desired schema.
    *   Compares this desired schema against the actual schema of the development database.
    *   Generates a new SQL migration file that contains the commands to safely transform the database from the old state to the new state.
    *   Applies the migration to the development database.

---

### `locus db studio`

Launches a powerful, web-based GUI (Prisma Studio) to view, create, and edit the data in your development database. This is an invaluable tool for debugging and testing.

*   **Usage:** `locus db studio`

---

### `locus test`

Discovers and runs all tests defined in the `tests { ... }` blocks within your `.locus` files, providing a seamless and co-located testing experience.

*   **Usage:** `locus test`
*   **What it does:**
    *   The compiler extracts all `tests` blocks into standard test files (e.g., using Jest or Vitest).
    *   It runs the test runner and displays the results in your terminal.


---

### `locus deploy`

A zero-configuration deployment command. Based on your `Locus.toml` file, it builds and deploys your entire application (frontend, backend, and database) to modern hosting platforms.

*   **Usage:** `locus deploy`
*   **What it does:**
    *   Reads deployment targets and credentials from `Locus.toml`.
    *   Runs `locus build`.
    *   Pushes the frontend build to a provider like Vercel or Netlify.
    *   Pushes the backend build to a provider like Fly.io or Railway.
    *   Connects the services and provisions a production database if needed (e.g., on Supabase).

---

### `locus add <package>`

The escape hatch for adding custom functionality. It intelligently installs an `npm` package into either the generated frontend or backend project.

*   **Usage:**
    *   `locus add react-confetti --frontend`
    *   `locus add stripe --backend`
*   **What it does:**
    *   Uses `npm` or `yarn` to install the specified package into the `package.json` of the generated frontend or backend project.
    *   This allows you to `import` and use the package in custom code blocks or plugins.
