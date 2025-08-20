# Locus CLI Reference

The `locus` command-line interface is your main tool for managing Locus projects. It provides commands for project creation, development, building, testing, database management, deployment, and extensibility.

## Core Commands

### `locus new <project_name>`
Scaffold a new project with boilerplate files and configuration.

### `locus dev`
Start the development server with hot-reloading for frontend and backend.

### `locus build`
Compile and optimize your project for production.

### `locus db migrate '<name>'`
Generate and apply database migrations based on your data model.

### `locus db studio`
Launch Prisma Studio to view and edit your database.

### `locus test`
Run all tests defined in your `.locus` files.

### `locus deploy`
Build and deploy your app to modern hosting platforms (Vercel, Railway, Supabase, etc.).

### `locus add <package>`
Install npm packages into the generated frontend or backend.

## Advanced Usage

- All commands work with zero configuration, but can be customized via `Locus.toml`.
- The CLI supports plugins for new commands and integrations.

See [Development Workflow](./development-workflow.md) and [Deployment](./deployment.md) for more details.
