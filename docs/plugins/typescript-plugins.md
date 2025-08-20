# Authoring TypeScript Plugins

TypeScript plugins provide the deepest level of integration with the Locus toolchain. They are the ideal solution for adding complex functionality, integrating with third-party services, or modifying the build process in ways that aren't possible with Blueprints alone.

This guide will walk you through the process of creating a TypeScript plugin, from setting up the project to hooking into the Locus compiler and CLI.

## When to Use a TypeScript Plugin

You should consider building a TypeScript plugin when you need to:
*   **Integrate with a JavaScript/TypeScript library:** For example, adding a payment processing library like Stripe or a charting library like D3.
*   **Add custom backend logic:** Such as creating API endpoints to handle webhooks from external services.
*   **Introduce new, complex UI components:** Providing React components that require significant client-side logic (e.g., a rich text editor).
*   **Add new commands to the `locus` CLI:** For tasks like `locus stripe:sync-products`.
*   **Perform custom code transformations:** Modifying the generated code at a low level during the build process.

## 1. Setting Up Your Plugin Project

A Locus plugin is a standard `npm` package.

1.  **Create a new directory** for your plugin and initialize it as an `npm` project.
    ```bash
    mkdir locus-plugin-example
    cd locus-plugin-example
    npm init -y
    ```

2.  **Install the Locus Plugin SDK** as a dependency. This package provides the necessary types and definitions for creating a plugin.
    ```bash
    npm install @plust/locus-plugin-sdk
    ```

3.  **Configure `package.json`:**
    *   Set `"type": "module"` to use ES module syntax.
    *   Ensure the `main` field points to your compiled output (e.g., `dist/index.js`).
    *   Add a `build` script to compile your TypeScript.

    **Example `package.json`:**
    ```json
    {
      "name": "locus-plugin-example",
      "version": "1.0.0",
      "description": "An example plugin for Locus.",
      "main": "dist/index.js",
      "type": "module",
      "scripts": {
        "build": "tsc"
      },
      "dependencies": {
        "@plust/locus-plugin-sdk": "^0.1.0"
      },
      "devDependencies": {
        "typescript": "^5.0.0"
      }
    }
    ```

4.  **Create a `tsconfig.json`** file for compiling your plugin.

## 2. The Plugin Entry Point

The main file of your plugin (e.g., `src/index.ts`) must have a default export that calls `defineLocusPlugin`.

```typescript
// file: src/index.ts

import { defineLocusPlugin, LocusContext, LocusPlugin } from '@plust/locus-plugin-sdk';

// The defineLocusPlugin function provides type safety and context.
export default defineLocusPlugin((context: LocusContext): LocusPlugin => {
  // The context object provides information about the user's project.
  console.log(`Initializing plugin for project: ${context.config.app.name}`);

  return {
    // The name of your plugin.
    name: 'locus-plugin-example',

    // Hooks into the Locus lifecycle.
    onBuildStart() {
      console.log('Build is starting!');
    },

    onBuildEnd() {
      console.log('Build has finished!');
    }
  };
});
```

The `defineLocusPlugin` function takes a factory function as an argument. This factory receives the `LocusContext` and must return a `LocusPlugin` object.

*   **`LocusContext`**: An object containing the parsed `Locus.toml` configuration and other information about the user's project.
*   **`LocusPlugin`**: An object that defines your plugin's name and the lifecycle hooks it wants to use.

## 3. Implementing Plugin Hooks

Hooks are functions that Locus calls at specific points in its execution.

### Adding a CLI Command

The `registerCommands` hook allows you to add subcommands to the `locus` CLI. It receives an instance of the `commander` program.

```typescript
// in your plugin object
registerCommands(program) {
  program
    .command('hello')
    .description('A command from our example plugin.')
    .action(() => {
      console.log('Hello from the plugin!');
    });
}
```
A user could then run `locus hello`.

### Modifying the Backend Server

The `onBackendBuild` hook allows you to get a reference to the Express application instance before the server is started. You can use this to add middleware, new routes, or anything else an Express app can do.

```typescript
// in your plugin object
onBackendBuild(app) {
  // Add a custom API endpoint.
  app.get('/api/plugin-data', (req, res) => {
    res.json({ message: 'This data comes from a plugin.' });
  });

  // Add a middleware.
  app.use((req, res, next) => {
    console.log(`Request received by plugin: ${req.path}`);
    next();
  });
}
```

### Providing Custom UI Components

This is one of the most powerful features. A plugin can provide custom React components that users can then use in their `.locus` files.

1.  **Create your React component** in your plugin's project (e.g., `src/components/MyComponent.tsx`).
2.  **Expose it via the `getCustomComponents` hook.** This hook should return an object where keys are the component names (as they will be used in Locus) and values are the file paths to the compiled components.

```typescript
// in your plugin object
getCustomComponents() {
  return {
    // When a user writes <MyPluginComponent> in Locus...
    'MyPluginComponent': {
      // ...the compiler will import it from this path.
      path: './dist/components/MyComponent.js'
    }
  };
}
```

The Locus compiler will handle the rest, making `<MyPluginComponent>` available in the user's `ui` blocks.

## 4. Using the Plugin in a Locus Project

To use your plugin, a developer would:

1.  **Install it** from npm into their project's `devDependencies`.
    ```bash
    npm install --save-dev locus-plugin-example
    ```
2.  **Register it** in their `Locus.toml` file.
    ```toml
    [app]
    name = "MyApp"

    [plugins]
    my-plugin = "locus-plugin-example"
    ```

The next time they run `locus dev` or any other command, Locus will load `locus-plugin-example` and execute its hooks.
