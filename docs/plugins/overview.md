# Extending Locus: An Overview

No framework can anticipate every need. A key principle of Locus is providing clear "escape hatches" and extensibility points to ensure the system never imposes a hard limit on what's possible. The Locus Plugin Ecosystem is designed to prevent the "glass ceiling" effect often found in closed systems.

There are two primary ways to extend Locus, each designed for a different use case:

1.  **TypeScript Plugins (Deep Integration):** For adding complex, tightly integrated functionality.
2.  **Blueprints (Shareable Features):** For creating and sharing pre-built features written in Locus itself.

## 1. TypeScript Plugins

TypeScript plugins are for developers who need to hook directly into the `locus` CLI and compilation process. This is the most powerful way to extend Locus and is ideal for integrating with third-party services or adding new core capabilities.

### What You Can Do with a TypeScript Plugin:

*   **Add new CLI commands:**
    *   Create a command like `locus stripe setup` that configures Stripe webhooks and API keys.
    *   Create a command like `locus email send-test` to send a test email via a provider like Resend or Postmark.

*   **Add custom API endpoints to the backend:**
    *   Create a new route, for example `/api/webhooks/stripe`, to handle incoming webhooks from an external service. The plugin can define the route and the handler function that executes when the route is hit.

*   **Provide new UI components for `.feature` files:**
    *   Expose a pre-built, highly interactive component like `<StripeCheckoutButton>` or `<MapboxMap>` that can be used directly in the `ui` block of any `.feature` file. The plugin would handle the underlying JavaScript and React component logic.

*   **Inject code during compilation:**
    *   A plugin can programmatically add providers to the root of the generated React application, which is essential for libraries that require a context provider (like UI component libraries or state management tools).

TypeScript plugins offer deep integration and are the right choice for building robust, shareable integrations that feel like a native part of the Locus ecosystem.

**[→ Learn how to build TypeScript Plugins](./typescript-plugins.md)**

## 2. Blueprints

Blueprints are a simpler, yet powerful, type of plugin written entirely in Locus. They are shareable templates for common application features. Think of them as "copy-paste on steroids."

Instead of integrating with the compiler, a blueprint allows a developer to stamp out a complete, pre-built feature into their own project with a single command.

### What You Can Do with a Blueprint:

*   **Scaffold common features:**
    *   A `blog` blueprint could generate the `Post.entities` and `Author.entities` files, a `blog.feature` file with pages for listing posts and viewing a single post, and all the necessary UI components.
    *   An `auth` blueprint could generate `login.feature`, `signup.feature`, `user.entities`, and a global `auth.store` to handle user authentication.
    *   A `settings-page` blueprint could create a feature where users can update their profile information.

### The Blueprint Workflow

1.  **Find a Blueprint:** Blueprints can be shared via Git repositories.
2.  **Run the Generator:** A developer uses a command like `locus generate from <git_url>`.
3.  **Customize:** The command copies the Locus files from the blueprint directly into the user's project. The generated code is not a black box; it's clean, readable Locus code that the developer can now modify, customize, and extend to fit their exact needs.

Blueprints are perfect for accelerating development by providing working solutions to common problems, which can then be tailored as needed. They promote best practices and help developers avoid reinventing the wheel.

**[→ Learn how to create Blueprints](./blueprints.md)**

## Which Should I Use?

| Use Case                                                     | Best Choice         | Why                                                                                             |
| :----------------------------------------------------------- | :------------------ | :---------------------------------------------------------------------------------------------- |
| I want to integrate a third-party JS library (e.g., Stripe, Mapbox). | **TypeScript Plugin** | You need to manage npm packages, potentially add API routes, and provide custom React components. |
| I want to add a new command to the `locus` CLI.              | **TypeScript Plugin** | This requires hooking into the CLI framework.                                                   |
| I have built a feature (like a blog or user profiles) that I want to reuse in other projects. | **Blueprint**         | The feature is written in Locus, and you want to share the Locus code itself as a template.     |
| I want to quickly add user authentication to my new app.       | **Blueprint**         | You can generate a pre-built auth system and then customize the `.feature` files as needed.     |
