# Locus CLI Reference

The `locus` command-line interface is your main tool for managing Locus projects. It provides commands for project creation, development, building, testing, database management, deployment, and extensibility.

## Core Commands

### `locus new <project_name>`
Scaffold a new project with boilerplate files and configuration.

### `locus dev`
Start the development server with hot-reloading for frontend and backend.

#### Error Output Format

Both `locus build` and `locus dev` support structured error output for editor/tool integrations:

- `--errors pretty` (default): Human-friendly boxed messages with codeframes.
- `--errors json`: One JSON object per error written to stderr.

JSON schema (stable fields):

```
{
	"code": "parse_error" | "lex_error" | "validation_error" | "merge_error",
	"message": string,        // Friendly message, e.g., "Expected ':' but found 'String'"
	"rawMessage": string,     // Underlying message from the parser/lexer/throw site
	"filePath": string | null,
	"line": number | null,
	"column": number | null,
	"length": number | null,  // Length of the highlighted span
	"heading": string         // e.g., "Parse Error", "Validation Error"
}
```

Example:

```
$ locus build --errors json
{"code":"parse_error","message":"Expected ':' but found 'String'","rawMessage":"Expecting token of type --> Colon <-- but found --> 'String' <--","filePath":"src/db.locus","line":4,"column":12,"length":6,"heading":"Parse Error"}
```

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

See also: [Common Errors & Fixes](../guides/common-errors.md).
