<div align="center">
  <h1>Locus</h1>
  <p><strong>The Full-Stack App Compiler</strong></p>
  <p>Locus is a modern toolchain that transforms simple <code>.locus</code> files into complete, production-ready web applications. Define your data models, backend logic, and frontend UI in a single, easy-to-understand language, and let Locus generate the code for you.</p>
  <p><strong>Say goodbye to boilerplate and context-switching, and hello to rapid, enjoyable development.</strong></p>
</div>

<div align="center">
  <a href="https://github.com/PlustOrg/locus/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node.js version"></a>
  <a href="https://github.com/PlustOrg/locus/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href="https://deepwiki.com/PlustOrg/locus"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</div>

---

## What is Locus?

Locus is a source-to-source compiler that lets you build full-stack web applications with unprecedented speed and simplicity. Instead of juggling multiple languages and frameworks, you write simple, declarative `.locus` files. Locus then generates everything you need:

- **Backend API:** A robust Express.js server with RESTful routes.
- **Database:** A complete Prisma schema with migrations.
- **Frontend UI:** Modern React components and Next.js pages.
- **Design System:** A themable and customizable design system using design tokens.

Locus is designed to help you focus on what matters: your application's features and user experience.

## ✨ Key Features

- **One Language, Full Stack:** Define your database schema, API logic, and frontend UI using a single, cohesive language. No more context-switching between different technologies.
- **Rapid Development:** Go from idea to a running application in minutes. The `locus dev` command provides a hot-reloading development server for instant feedback.
- **Production-Ready by Default:** Locus generates clean, maintainable code that's ready for production. It's built on top of trusted technologies like Express, React, and Prisma.
- **Built-in Design System:** Create a beautiful, consistent look and feel for your application with a themable design system that's easy to customize.
- **Extensible and Customizable:** Locus is built to be extended. Create your own plugins to add new features or integrate with other tools.
- **Clear and Helpful Errors:** When things go wrong, Locus provides clear and actionable error messages that pinpoint the exact location of the problem.

## 💡 How It Works

Locus works in three simple steps:

1.  **It reads your `.locus` files:** Locus looks for all the `.locus` files in your project and reads them to understand the application you want to build.
2.  **It creates a blueprint:** Locus combines all the information from your `.locus` files to create a single, unified blueprint of your application.
3.  **It generates your code:** Locus uses the blueprint to generate all the necessary code for your backend, database, and frontend.

This process is deterministic, which means that the same `.locus` files will always produce the same code. This makes your application predictable and easy to maintain.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (Node Package Manager)

### 1. Install the Locus CLI

Open your terminal and run the following command to install the Locus CLI globally on your system:

```bash
npm install -g @plust/locus
```

### 2. Create a New Project

Once the CLI is installed, you can create a new Locus project:

```bash
locus new my-awesome-app
cd my-awesome-app
```

This will create a new directory called `my-awesome-app` with a sample Locus project.

### 3. Start the Development Server

Now, you can start the development server:

```bash
locus dev
```

This will start a development server with hot-reloading. You can now open your browser and navigate to `http://localhost:3000` to see your application running.

### 4. Your First `.locus` File

Locus uses `.locus` files to define your application. Open the `src/main.locus` file in your new project to see an example of the Locus language:

```locus
// src/main.locus

database {
  entity Post {
    title: String
    content: Text
    published: Boolean @default(false)
  }
}

page HomePage {
  state {
    posts: list of Post = []
  }

  on load {
    posts = find(Post, where: { published: true })
  }

  ui {
    <Stack>
      <h1>My Blog</h1>
      <for:each={post in posts}>
        <Stack>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </Stack>
      </for:each>
    </Stack>
  }
}
```

Now you're ready to start building your own applications with Locus!

## 🗂️ Generated Project Structure

```
./generated/
├── prisma/
│   └── schema.prisma       # Database schema
├── routes/
│   └── *.ts                # Express routers per entity
├── react/
│   ├── pages/
│   │   └── *.tsx           # React pages
│   └── components/
│       └── *.tsx           # React components
├── theme.css               # Design tokens as CSS variables
└── server.ts               # Express app bootstrap
```

## 🛠️ Command-Line Interface (CLI)

Locus comes with a powerful CLI to help you manage your projects. Here are some of the most common commands:

| Command | Description |
| --- | --- |
| `locus new <name>` | Scaffold a new project with config and sample files. |
| `locus build` | Build the project, generating all the necessary files. |
| `locus dev` | Start a development server with hot-reloading. |
| `locus check` | Parse and validate your `.locus` files without generating code. |
| `locus format` | Format all your `.locus` files. |
| `locus db migrate` | Run database migrations. |
| `locus db studio` | Open the Prisma Studio to manage your data. |
| `locus deploy <env>` | Deploy your application to the specified environment. |
| `locus plugins list` | List all the installed plugins. |
| `locus plugins doctor` | Diagnose your plugin setup and performance. |
| `locus doctor` | Diagnose your environment and configuration. |

### Experimental Commands

Locus also has some experimental commands that are still under development. These commands might change in the future.

| Command | Description |
| --- | --- |
| `locus workflow:run <name>` | Execute a workflow by name. |
| `locus explain <code>` | Explain an error or diagnostic code. |
| `locus ui:ast` | Parse a UI snippet and print the structured UI AST. |

### Common Flags

You can use the following flags with most commands:

-   `--src <dir>`: Specify the source directory for your `.locus` files.
-   `--out <dir>`: Specify the output directory for the generated code.
-   `--debug`: Print detailed timing and performance logs.

## ⚙️ Configuration

You can configure your Locus project in two ways:

### `Locus.toml`

The main configuration file for your project is `Locus.toml`. This file lives in the root of your project and allows you to configure things like deployment settings, authentication, and feature flags.

Here's an example of what a `Locus.toml` file might look like:

```toml
[deploy.production]
type = "vercel"
project = "my-awesome-app"
team = "my-team"

[auth]
jwtSecret = "your-super-secret-jwt-secret"
```

For a full list of configuration options, please see the [configuration documentation](docs/reference/configuration.md).

### `design_system` block

You can define your application's design tokens (colors, fonts, etc.) in a `design_system` block in any of your `.locus` files. This allows you to keep your design system close to your code.

Here's an example of a `design_system` block:

```locus
design_system {
  colors {
    "light" {
      primary: "#007aff"
      background: "#ffffff"
    }
    "dark" {
      primary: "#0a84ff"
      background: "#1c1c1e"
    }
  }
}
```

## 🤝 Contributing

We welcome contributions from the community! Whether you're a seasoned developer or just getting started, there are many ways to help improve Locus.

### Development Workflow

1.  **Fork and clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/locus.git
    cd locus
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the tests:**
    ```bash
    npm test
    ```

4.  **Make your changes:**
    Now you're ready to make your changes to the codebase.

### Submitting a Pull Request

When you're ready to submit your changes, please follow these steps:

1.  Create a new branch for your changes:
    ```bash
    git checkout -b my-awesome-feature
    ```

2.  Commit your changes with a clear commit message:
    ```bash
    git commit -m "feat: add my awesome feature"
    ```

3.  Push your changes to your fork:
    ```bash
    git push origin my-awesome-feature
    ```

4.  Open a pull request on the [Locus repository](https://github.com/PlustOrg/locus/pulls).

For more detailed information on contributing, please see our [**Contributing Guide**](CONTRIBUTING.md).

### Code of Conduct

We have a [Code of Conduct](CODE_OF_CONDUCT.md) that we expect all contributors to adhere to. Please be sure to read it before contributing.

## 📚 Documentation

Locus has extensive documentation to help you get the most out of it. Here are some of the most important documents:

### Getting Started

-   **[Introduction to Locus](docs/introduction/philosophy.md)**: Learn about the philosophy behind Locus and why it was created.
-   **[Language Overview](docs/introduction/language.md)**: A quick overview of the Locus language and its core concepts.
-   **[Getting Started Guide](docs/guides/getting-started.md)**: A detailed guide to creating your first Locus application.

### Core Concepts

-   **[Data Modeling](docs/language/data-modeling.md)**: Learn how to define your database schema with entities and relationships.
-   **[Application Logic](docs/language/application-logic.md)**: Learn how to write business logic with pages, components, and stores.
-   **[UI Syntax](docs/language/ui-syntax.md)**: Learn how to create user interfaces with the Locus UI syntax.
-   **[Design System](docs/guides/design-system.md)**: Learn how to create a themable design system for your application.

### Advanced Topics

-   **[Plugins](docs/guides/plugins.md)**: Learn how to extend Locus with your own plugins.
-   **[Deployment](docs/toolchain/deployment.md)**: Learn how to deploy your Locus application to production.
-   **[Architecture](docs/reference/architecture.md)**: A deep dive into the architecture of the Locus compiler.

### Checklists

-   **[Security Checklist](docs/guides/security-checklist.md)**: A checklist of security best practices to follow when building your application.
-   **[Production Readiness Checklist](docs/reference/production-readiness-checklist.md)**: A checklist to ensure your application is ready for production.

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


