# Development Workflow

This guide covers the typical day-to-day workflow you'll use when building an application with Locus. The process is designed to be fast, iterative, and keep you in a state of flow.

## The Core Development Loop

Your primary tool during development is the `locus dev` command.

1.  **Start the Dev Server:** Open your terminal, navigate to your project folder, and run:
    ```bash
    locus dev
    ```
    This single command compiles your entire project, starts the backend API and frontend web server, and then actively watches all your `.locus` files for changes.

2.  **Open Your Editor and Browser:** Arrange your windows side-by-side. On one screen, have your code editor open to your `.locus` files. On the other, have your web browser open to `http://localhost:3000`.

3.  **Write Code and Save:** Make changes to your pages, components, or design system in your `.locus` files. The moment you hit save, `locus dev` detects the change, incrementally rebuilds only what's necessary, and automatically refreshes your browser. Changes to your UI and styling appear almost instantly.

This `edit -> save -> see changes` loop is the heart of the Locus workflow.

## Handling Database Changes

When you edit a `database` block in any `.locus` file, the workflow is slightly different.

1.  **Edit Your Schema:** Add or change an `entity`, field, or relationship.
2.  **Save the File:** When you save, `locus dev` will detect the change and print a message in your terminal telling you that your database schema is out of sync with your code. It will give you a `locus db migrate` command to run.
3.  **Run the Migration:** Open a **second terminal window** (leaving `locus dev` running in the first) and run the suggested command. This will generate and apply a new migration, safely updating your database to match your new schema.

Keeping a second terminal window open for database commands is a common practice during Locus development.

## Debugging Your Application

If things aren't working as expected, you have a few tools at your disposal:

-   **Browser DevTools:** Because Locus generates source maps, you can debug your application logic directly in your browser's developer tools. You can set breakpoints and inspect variables within your Locus `action` and `on load` blocks.
-   **Console Logging:** Use the `log()` function inside any `action` to print values to the browser's JavaScript console.
    ```locus
    action doSomething() {
      const myValue = "Hello, World!"
      log(myValue) // This will appear in the browser console
    }
    ```
-   **Database GUI:** If you suspect the problem is with your data, run `locus db studio` in your second terminal to get a complete GUI for inspecting, adding, and deleting records in your database.

## A Few Best Practices

-   **One Feature, One File:** While you can put everything in one giant `.locus` file, it's often cleaner to separate major features into their own files (e.g., `users.locus`, `products.locus`, `admin.locus`). Locus automatically merges them all at compile time.
-   **Use Components for Reusability:** If you find yourself writing the same UI code in multiple places, extract it into a `component` to keep your code DRY (Don't Repeat Yourself).
-   **Use Stores for Global State:** For state that needs to be accessed by many different pages (like the currently logged-in user), use a `store`. For state that's only used by a single page, keep it in that page's `state` block.
-   **Leverage Design Tokens:** Define your colors, fonts, and spacing in your `design_system` block and reuse them. This makes it easy to keep your application's look and feel consistent.
