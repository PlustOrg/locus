<div align="center">
  <h1>Locus</h1>
  <p><strong>The Full-Stack App Compiler</strong></p>
  <p>Transform <code>.locus</code> files into complete, production-ready web applications.</p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node.js version">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</div>

---

Locus is a source-to-source compiler that takes a simple, declarative syntax in `.locus` files and generates a full-stack web application, including:

*   **Backend API:** Express.js server with RESTful routes.
*   **Database:** Prisma schema for your data models.
*   **Frontend UI:** React components and pages built with Next.js.

It's designed for rapid development, deterministic builds, and a seamless developer experience.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Quickstart](#quickstart)
  - [Prerequisites](#prerequisites)
  - [1. Install the CLI](#1-install-the-cli)
  - [2. Create a New Project](#2-create-a-new-project)
  - [3. Start the Development Server](#3-start-the-development-server)
- [Generated Project Structure](#generated-project-structure)
- [Command-Line Interface (CLI)](#command-line-interface-cli)
- [Configuration](#configuration)
- [Development](#development)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Key Features

*   **Declarative Syntax:** Define your entire application—database, API, and UI—in one place.
*   **Full-Stack Generation:** Automatically creates a Prisma schema, Express routes, and React/Next.js components.
*   **Incremental Builds:** A smart `dev` mode watches for file changes and performs fast, incremental rebuilds.
*   **Helpful Diagnostics:** Clear error messages (with file, line, and column) for syntax and logic issues.
*   **Extensible:** Designed to be extended with a plugin architecture.
*   **Performance-Focused:** Built for speed with a lightweight parser and efficient code generation.

## How It Works

The Locus compiler follows a three-step process:

1.  **Parse:** It reads all `.locus` files in your source directory and builds an Abstract Syntax Tree (AST) using a high-performance parser (Chevrotain).
2.  **Merge:** It intelligently merges the different parts of your application (database entities, features, UI components) into a single, unified representation.
3.  **Generate:** It walks the merged AST to produce the final source code for the database, API, and UI.

This deterministic process ensures that the same `.locus` input always produces the same output.

## Quickstart

### Prerequisites

*   Node.js (v18 or higher)

### 1. Install the CLI

For local development of the compiler:
```bash
npm install
npm link # Makes the 'locus' command available globally
```

### 2. Create a New Project

Scaffold a new Locus project with a sample file and configuration:
```bash
locus new my-awesome-app
cd my-awesome-app
```

### 3. Start the Development Server

Run the `dev` command to build the project and watch for changes:
```bash
locus dev --src .
```
This command:
*   Performs an initial build.
*   Starts the backend Express server and the frontend Next.js development server.
*   Watches for changes to your `.locus` files and rebuilds incrementally.

## Generated Project Structure

The `locus build` command writes the generated application to the `--out` directory (default: `./generated`).

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
└── server.ts               # Express app bootstrap
```

## Command-Line Interface (CLI)

| Command                  | Description                                                              |
| ------------------------ | ------------------------------------------------------------------------ |
| `locus new <name>`       | Scaffolds a new Locus project with a `Locus.toml` config file.           |
| `locus build`            | Performs a full, deterministic build of the project.                     |
| `locus dev`              | Starts a development server with file watching and incremental rebuilds. |
| `locus db migrate`       | Runs `prisma migrate dev` in the generated project.                      |
| `locus db studio`        | Launches Prisma Studio to view and manage your data.                     |
| `locus deploy`           | Prepares the project for deployment based on `Locus.toml`.               |

**Common Flags:**
*   `--src <dir>`: Specifies the source directory for `.locus` files.
*   `--out <dir>`: Specifies the output directory for generated code.
*   `--debug`: Enables detailed timing logs for performance analysis.

## Configuration

Project-level settings are managed in a `Locus.toml` file, which is created by `locus new`. This file defines source paths, output directories, and deployment configurations.

Design system tokens (e.g., colors, fonts) are defined directly within `.locus` files inside a `design_system { ... }` block.

## Development

Interested in contributing to the Locus compiler itself?

*   **Technology Stack:** TypeScript, Jest, Chevrotain, Commander.js
*   **Development Plan:** The project follows a strict, test-driven development process outlined in `planning/development-plan.md`.

To get started:
1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Run the test suite: `npm test`

## Documentation

All documentation is located in the `planning/` directory.

*   **Language Reference:** `planning/language/`
*   **Toolchain & CLI:** `planning/toolchain/`
*   **Design System:** `planning/design-system/`
*   **Architecture:** `planning/architecture.md`

## Contributing

We welcome contributions! Please see the open items in `planning/implementation-checklist.md`. When contributing, please ensure you add tests for new features and that code generation remains deterministic.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

