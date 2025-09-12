# CLI Reference

The `locus` command-line interface (CLI) is your primary tool for creating, managing, and building Locus projects.

## `locus new`
Scaffolds a new Locus project in a directory with the specified name.

**Usage:**
```bash
locus new <project-name>
```

**Arguments:**
- `<project-name>` (required): The name of the directory to create for your project.

**What it does:**
This command creates a new folder and populates it with a standard set of starter files to get you up and running quickly:
- `Locus.toml`: The main configuration file for your project.
- `database.locus`: A sample data model with a `User` entity.
- `app.locus`: A sample home page.
- `theme.locus`: A sample design system for styling.
- `authAdapter.js`: An example file for setting up custom authentication.

---

## `locus build`
Compiles your `.locus` files into a production-ready application. This command performs a full, deterministic build of all artifacts.

**Usage:**
```bash
locus build [options]
```

**Options:**

| Flag                 | Description                                                              |
| :------------------- | :----------------------------------------------------------------------- |
| `--src <dir>`        | Specifies the source directory for `.locus` files (default: `.`).          |
| `--out <dir>`        | Specifies the output directory for generated code (default: `generated`). |
| `--errors <format>`  | Sets the error output style. Can be `pretty` (default) or `json`.        |
| `--prisma-generate`  | Automatically runs `npx prisma generate` after the build.                |
| `--dry-run`          | Lists the files that would be generated without writing anything to disk. |
| `--emit-js`          | Compiles the generated TypeScript into JavaScript in a `dist` folder.    |
| `--suppress-warnings`| Prevents build warnings from being printed to the console.               |
| `--debug`            | Prints detailed timing and performance logs for the build process.       |

---

## `locus dev`
Starts the development server. This command runs an initial build, starts the backend and frontend servers, and watches your `.locus` files for changes, enabling a fast, live-reloading workflow.

**Usage:**
```bash
locus dev [options]
```

**Options:**

| Flag                 | Description                                                              |
| :------------------- | :----------------------------------------------------------------------- |
| `--src <dir>`        | Specifies the source directory to watch (default: `.`).                  |
| `--errors <format>`  | Sets the error output style. Can be `pretty` (default) or `json`.        |
| `--emit-js`          | Compiles generated TS to JS on the fly (for `ts-node` alternatives).     |
| `--suppress-warnings`| Prevents warnings from being printed to the console.                     |
| `--quiet`            | Hides the startup banner and other informational logs.                   |
| `--log-file <path>`  | Mirrors all development server output to the specified log file.         |
| `--debug`            | Prints detailed timing logs for incremental rebuilds.                    |

**Environment Variables:**
- `API_PORT` / `PORT`: Sets the port for the backend API server (defaults to `3001`).
- `ENABLE_CORS=1`: Enables CORS middleware on the API server for cross-origin requests.
- `LOCUS_NO_UPDATE_CHECK=1`: Disables the periodic CLI update notification.
- `LOCUS_WORKFLOW_JIT=1`: Enables experimental JIT compilation for workflows.
- `LOCUS_PARALLEL_PARSE=1`: Enables experimental parallel parsing of source files.

---

## `locus db`
A wrapper for common database operations, powered by Prisma.

**Usage:**
```bash
locus db <subcommand>
```

**Subcommands:**
- `migrate`: Updates your database schema to match your data models. This command runs `npx prisma migrate dev`, which will prompt you for a name for the new migration.
  ```bash
  locus db migrate
  ```
- `studio`: Starts the Prisma Studio GUI, a powerful tool for viewing and editing the data in your database.
  ```bash
  locus db studio
  ```

---

## `locus deploy`
Prepares your project for deployment and displays the configured deployment targets.

**Usage:**
```bash
locus deploy <environment>
```

**Arguments:**
- `<environment>` (required): The name of the deployment environment to use (e.g., `production`, `staging`).

**What it does:**
This command does **not** perform a deployment itself. Instead, it:
1. Runs a full production build of your project (`locus build`).
2. Reads your `Locus.toml` file and looks for a `[deploy.environment]` section that matches the environment you specified.
3. Prints the configured deployment platforms (e.g., Vercel, Railway) based on that section.

This serves as a pre-flight check before you manually run the deployment commands for your hosting provider.---

## `locus check`
Parses and validates your `.locus` files without generating any output. Useful for quick syntax and semantic validation.

**Usage:**
```bash
locus check [options]
```

**Options:**
- `--src <dir>`: Source directory (default: `.`)
- `--errors <format>`: Error output format: `pretty` or `json`

---

## `locus format`
Formats all `.locus` source files according to the standard style conventions.

**Usage:**
```bash
locus format [options]
```

**Options:**
- `--src <dir>`: Source directory (default: `.`)

---

## `locus doctor`
Diagnoses your environment and configuration, providing a JSON report of system information, flags, and plugin performance data.

**Usage:**
```bash
locus doctor [options]
```

**Options:**
- `--src <dir>`: Source directory (default: `.`)

---

## `locus workflow:run`
Executes a workflow by name. This is an experimental feature for testing workflow definitions.

**Usage:**
```bash
locus workflow:run <name> [options]
```

**Arguments:**
- `<name>` (required): The workflow name to execute

**Options:**
- `--src <dir>`: Source directory (default: `.`)
- `--inputs <json>`: JSON object of input bindings (default: `{}`)
- `--dry-run`: Parse and validate only, do not execute

---

## `locus plugins`
Tools for inspecting the Locus plugin ecosystem in your project.

**Usage:**
```bash
locus plugins <subcommand>
```

**Subcommands:**
- `list`: Shows a simple list of all plugins that are currently installed and registered in your project.
  ```bash
  locus plugins list
  ```
- `doctor`: A diagnostic tool that runs a dry run of the plugin lifecycle hooks and reports on which hooks each plugin uses, along with any warnings or performance information.
  ```bash
  locus plugins doctor
  ```
  Sample JSON fields (when `--errors json` or future `--json` flag is used):
  ```jsonc
  {
    "plugins": [ { "name": "MyAwesomePlugin", "hooks": ["onParseComplete"], "timings": { "onParseComplete": 12 } } ],
    "pluginPerfCache": "present", // or "absent"
    "warnings": ["Plugin loaded! Saw 3 files."],
    "meta": { "pluginPerfDiff": [ { "name": "MyAwesomePlugin", "deltaMs": 8 } ] }
  }
  ```
  `pluginPerfCache` indicates whether `.locus_plugin_perf.json` exists (used for perf diffing).
