# Command-Line Interface (CLI)

The Locus CLI is the primary tool for managing your Locus projects. It provides a set of commands for common development tasks, from creating a new project to building and deploying it.

## `locus new <name>`

Scaffolds a new Locus project.

-   **Usage**: `locus new my-app`
-   **Description**: Creates a new directory with the given name and initializes it with a basic Locus project structure, including a `Locus.toml` configuration file.

## `locus build`

Builds the project.

-   **Usage**: `locus build`
-   **Description**: Compiles the `.locus` files into a full-stack web application. The generated code is written to the output directory, which is specified by the `--out` flag.
-   **Options**:
    -   `--src <dir>`: The source directory for `.locus` files. Defaults to the current directory.
    -   `--out <dir>`: The output directory for the generated code. Defaults to `generated`.

## `locus dev`

Starts the development server.

-   **Usage**: `locus dev`
-   **Description**: Starts a development server that watches for changes to your `.locus` files and automatically rebuilds the project.
-   **Options**:
    -   `--src <dir>`: The source directory for `.locus` files. Defaults to the current directory.

## `locus db <subcommand>`

Manages the database.

-   **Usage**: `locus db migrate|studio`
-   **Description**: Provides subcommands for managing the database:
    -   `migrate`: Runs database migrations.
    -   `studio`: Opens the Prisma Studio to view and manage your data.

## `locus deploy <env>`

Deploys the project.

-   **Usage**: `locus deploy production`
-   **Description**: Deploys the project to the specified environment. The deployment configuration is defined in `Locus.toml`.
