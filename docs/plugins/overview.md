# Plugin System Overview

While Locus is designed to be a powerful, all-in-one toolchain, it cannot anticipate every possible need or third-party integration. To prevent hitting a "glass ceiling," Locus is built with an extensible plugin architecture. Plugins allow you to enhance the Locus compiler and CLI with new capabilities, from adding support for new services to creating shareable code templates.

There are two main types of plugins in the Locus ecosystem:

1.  **TypeScript Plugins:** For deep, programmatic integration with the compiler and CLI.
2.  **Blueprints:** For creating and sharing reusable feature templates written in Locus itself.

## 1. TypeScript Plugins: Deep Integration

TypeScript plugins are for developers who want to add significant new functionality to Locus. These are `npm` packages that hook directly into the Locus compilation and command lifecycle.

### What They Can Do

*   **Add New CLI Commands:** A plugin can register new commands with the `locus` CLI. For example, a Stripe plugin could add `locus stripe:setup` to handle API key configuration.
*   **Extend the Backend API:** Plugins can add new API endpoints to the generated Express server. This is perfect for handling webhooks from third-party services.
*   **Introduce New UI Components:** A plugin can provide pre-built React components that can be used directly within the `ui` block of your `.locus` files. For example, a mapping plugin could provide a `<MapboxGL>` component.
*   **Modify the Build Process:** Plugins can tap into different stages of the build process to add custom validation, code transformations, or asset processing.

### How They Work

A TypeScript plugin is an `npm` package that exports a specific function, `defineLocusPlugin`. This function returns an object that describes the plugin's hooks and contributions.

**Example Plugin Structure (`locus-stripe-plugin/index.ts`):**

```typescript
import { defineLocusPlugin, LocusContext } from '@plust/locus-plugin-sdk';

export default defineLocusPlugin((context: LocusContext) => {
  return {
    name: 'locus-stripe-plugin',

    // Register a new CLI command
    registerCommands(program) {
      program
        .command('stripe:sync-products')
        .description('Sync products from Stripe to the local database')
        .action(async () => {
          // Custom logic to fetch from Stripe API and update DB
          console.log('Syncing products...');
        });
    },

    // Add a new route to the backend server
    onBackendBuild(expressApp) {
      expressApp.post('/webhooks/stripe', (req, res) => {
        // Logic to handle incoming Stripe webhooks
        res.sendStatus(200);
      });
    },
  };
});
```

To use this plugin, a developer would install it via `npm` and register it in their `Locus.toml` file.

For a detailed guide, see **[Authoring TypeScript Plugins](./typescript-plugins.md)**.

## 2. Blueprints: Shareable Locus Code

Blueprints are a simpler, yet powerful, way to create reusable patterns. A blueprint is essentially a template for a common feature (like a blog, a user authentication system, or a contact form) written entirely in Locus.

### What They Are

*   A collection of `.locus` files.
*   May include placeholder variables (e.g., `{{PRIMARY_ENTITY}}`).
*   Published to a registry for easy discovery.

### How They Work

The `locus generate` command is used to find and apply a blueprint.

**Example Usage:**

```bash
# This command would find the 'blog' blueprint
locus generate blog
```

The CLI would then:
1.  Fetch the blueprint's `.locus` files.
2.  (If necessary) Ask the user a few questions to fill in the placeholder variables (e.g., "What do you want to call your blog posts? `Post`").
3.  Copy the processed `.locus` files directly into the user's `src/` directory.

The result is that the user instantly gets a complete, working feature added to their project. The generated code is standard Locus code, so it's fully editable and customizable.

### Use Cases for Blueprints

*   **Authentication:** A blueprint could set up `User` and `Credential` entities, `Login` and `Register` pages, and the necessary actions.
*   **Blog:** Could create `Post` and `Category` entities, and pages for listing and viewing posts.
*   **E-commerce:** A basic product catalog and shopping cart system.
*   **SaaS Boilerplate:** User profiles, team management, and subscription logic.

For a detailed guide, see **[Creating Blueprints](./blueprints.md)**.

## Choosing the Right Plugin Type

| Feature                               | Use a TypeScript Plugin | Use a Blueprint                     |
| :------------------------------------ | :---------------------- | :---------------------------------- |
| Integrating a third-party JS library  | **Yes**                 | No                                  |
| Adding a webhook handler              | **Yes**                 | No                                  |
| Creating a new CLI command            | **Yes**                 | No                                  |
| Sharing a common feature pattern      | No                      | **Yes**                             |
| Stamping out boilerplate Locus code   | No                      | **Yes**                             |
| Creating a starter kit (e.g., blog)   | No                      | **Yes**                             |
