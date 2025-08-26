# Getting Started

Welcome to Locus! This guide will walk you through building your first full-stack application in just a few minutes. We'll install the Locus command-line tools, create a new project, and see the magic of live development in action.

## Before You Begin

Make sure you have **Node.js** installed on your computer (version 18 or newer). You can check by opening your terminal and running:

```bash
node --version
# You should see something like v18.17.0 or higher
```

## Step 1: Install the Locus Toolkit

The Locus command-line interface (CLI) is your main tool for creating and managing projects. Let's install it globally on your system using npm.

```bash
npm install -g @plust/locus
```

> **What's happening?**
> This command downloads the `locus` package from the npm registry and makes the `locus` command available everywhere in your terminal.

To make sure it's installed correctly, you can ask for its version number:

```bash
locus --version
```

## Step 2: Create a New Project

Next, let's create a new project. The `locus new` command sets up a starter project for you with all the necessary files and folders.

```bash
locus new my-first-app
cd my-first-app
```

This creates a new folder called `my-first-app` and navigates you into it. Inside, you'll find:

```
my-first-app/
├── src/
│   ├── app.locus         # For your pages and components
│   ├── database.locus    # For your data models
│   └── theme.locus       # For your app's styling
└── Locus.toml            # Your project's configuration file
```

This simple structure is the foundation of your new app.

## Step 3: Start the Development Server

This is where the fun begins. The `locus dev` command compiles your `.locus` files, builds your entire application, starts up a development server, and watches for any changes you make.

```bash
locus dev
```

After a moment, you'll see a startup banner in your terminal that looks something like this:

```
┌────────────────────────────────────────────┐
│ App: my-first-app                          │
│ API:  http://localhost:3001                │
│ Web:  http://localhost:3000                │
│ ...                                        │
└────────────────────────────────────────────┘
```

Your app is now running! Open your web browser and navigate to **`http://localhost:3000`**. You should see a welcome page.

## Step 4: Make a Change

Locus is all about speed and live feedback. Let's change the database and see what happens.

1.  Open the `src/database.locus` file in your favorite code editor.
2.  You'll see a pre-made `User` entity. Let's add a new `Product` entity right below it.

    ```locus
    database {
      entity User {
        name: String
        email: String (unique)
      }

      // Add this new entity to your database
      entity Product {
        name: String
        price: Decimal
        inStock: Integer (default: 0)
      }
    }
    ```
3.  **Save the file.**

Back in your terminal where `locus dev` is running, you'll see a message that your data model has changed and that you need to run a database migration.

> **What's happening?**
> Locus detected a change to your `database` block and knows the database schema is out of sync. A migration is a safe way to update your database to match your new code.

4.  Open a **new terminal window** (don't close the `locus dev` server!) and run the command Locus suggests. It will look like this:

    ```bash
    locus db migrate 'add-product-entity'
    ```

This applies the change to your development database.

## Step 5: See Your Data

Now that you have a new `Product` table in your database, you can view and manage it with a built-in GUI.

In your **second terminal window**, run:

```bash
locus db studio
```

This command opens Prisma Studio in a new browser tab. It's a powerful database tool where you can see all your models. Click on `Product` to add a few new products to your database.

## You're All Set!

Congratulations! You've installed Locus, created a project, and experienced the live development workflow.

Now you're ready to dive deeper:
-   [Learn how to build pages and components](../language/ui-syntax.md)
-   [Customize your app's look and feel](./design-system.md)
-   [Explore the development workflow](../toolchain/development-workflow.md)
