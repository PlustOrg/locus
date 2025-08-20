# Getting Started with Locus

This guide will walk you through the entire process of installing the Locus CLI, creating a new project, and running the development server. By the end, you'll have a running full-stack application generated from just a few lines of Locus code.

## Prerequisites

Before you begin, ensure you have the following installed:
*   **Node.js**: Version 18 or higher.
*   **npm**: The Node.js package manager.

You can verify your Node.js installation by running:
```bash
node --version
```

## 1. Install the Locus CLI

The Locus command-line interface (CLI) is the primary tool for managing your projects. Install it globally on your system using `npm`.

```bash
npm install -g @plust/locus
```

This makes the `locus` command available in your terminal. You can verify the installation by running:

```bash
locus --version
```

## 2. Create a New Project

The `locus new` command scaffolds a complete project structure for you, including initial `.locus` files and a configuration file.

```bash
locus new my-first-app
cd my-first-app
```

This creates a new directory named `my-first-app` with the following structure:

```
my-first-app/
├── src/
│   ├── app.locus         # For pages and components
│   ├── database.locus    # For data models
│   └── theme.locus       # For design tokens
└── Locus.toml            # Project configuration
```

*   `Locus.toml`: The main configuration file for your project, including deployment settings.
*   `src/`: The source directory where all your `.locus` files live.

## 3. Start the Development Server

The `locus dev` command is the heart of the development workflow. It compiles your project, starts the frontend and backend servers, and watches for any changes you make.

```bash
locus dev
```

After a moment, you'll see output indicating that the servers are running. Your application is now available at `http://localhost:3000`.

Open this URL in your browser. You'll see a simple, pre-built welcome page.

## 4. Make Your First Change

Let's make a change to the database and see it reflected in the application.

1.  **Open `src/database.locus`** in your code editor. It will contain a sample `User` entity.
2.  **Add a new entity** to the file:

    ```locus
    database {
      entity User {
        name: String
        email: String (unique)
      }

      // Add this new entity
      entity Product {
        name: String
        price: Decimal
        stock: Integer
      }
    }
    ```

3.  **Save the file.**

4.  **Apply the database migration.** The `locus dev` server will detect the change to your data model and tell you that a database migration is needed. Open a **new terminal window** (leaving `locus dev` running) and run the suggested command:

    ```bash
    locus db migrate 'add-product-entity'
    ```
    This command safely updates your development database schema to include the new `Product` table.

## 5. View Your Data

With the migration applied, you can now interact with your new `Product` table using the built-in database GUI.

1.  In the second terminal, run:
    ```bash
    locus db studio
    ```
2.  This will open a new tab in your browser with Prisma Studio, a powerful tool for viewing and manipulating your data. You will see the `User` and `Product` models on the left. You can click on `Product` to add new records.

## Next Steps

Congratulations! You've successfully created a Locus project, modified the data model, and seen the development tools in action.

From here, you can explore more advanced topics:
*   **[Building UIs](./ui-syntax.md):** Learn how to create pages and components.
*   **[Data Relationships](./data-relationships.md):** Define how your data models connect to each other.
*   **[Theming](./theming.md):** Customize the look and feel of your application.
