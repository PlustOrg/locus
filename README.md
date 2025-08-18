# Locus Compiler

Locus is a TypeScript source-to-source compiler that turns `.locus` files into a full‑stack app:
- Database: Prisma schema (models, relations, defaults)
- API: Express routes and server bootstrap
- UI: React components and pages from a lightweight UI syntax

The language and development plan live in `docs/`. The compiler is test-driven and designed for deterministic, incremental builds.

## Features
- Parse and merge database, design_system, and features across files
- Generate Prisma schema, Express CRUD routes, and React UI
- Incremental dev build with file watching and caching
- Helpful diagnostics (file:line:column) for merges and generator errors
- Debug timings for parse/merge/generate phases

## Requirements
- Node.js 18+ and npm

## Installation
- Local development
	- Clone repo, then: `npm install`
	- Link CLI (optional): `npm link` to make the `locus` binary available.
- Project usage (from this repo)
	- Use `npx locus` via the linked binary or call the compiled CLI.

## Quickstart
1) Run tests
- `npm test`

2) Build a project
- `locus build --src ./src --out ./generated`
	- Outputs Prisma schema, Express routes, and React files under `./generated`.

3) Dev mode (watch + incremental rebuild)
- `locus dev --src ./src` (optionally add `--debug` for timings)
	- Watches `**/*.locus`, handles add/change/unlink, and rebuilds.

## Example
Minimal `.locus` demonstrating database + page + ui:

```locus
database {
	entity Customer {
		id: Integer
		email: String (unique)
	}
}

page Home {
	state { greeting: String = "Hello" }
	ui {
		<div>
			<h1>{greeting}</h1>
		</div>
	}
}
```

## Generated output structure
The build writes to your `--out` directory (default: `./generated`):
- `prisma/schema.prisma` — database schema
- `routes/*.ts` — Express routers per entity
- `server.ts` — Express app bootstrap
- `react/pages/*.tsx` — React pages
- `react/components/*.tsx` — React components

## CLI commands
- `locus build --src <dir> [--out <dir>] [--debug]`
	- Parse → merge → generate. Deterministic outputs, optional debug timings.
- `locus dev --src <dir> [--debug]`
	- Initial build + watcher with incremental cache; spawns frontend/backend stubs.
	- Env: `LOCUS_NEXT_CMD` can override Next dev command.
- `locus db migrate`
	- Runs Prisma migrate in the generated project.
- `locus db studio`
	- Launches Prisma Studio.
- `locus new <name>`
	- Scaffolds a new Locus project with `Locus.toml`.
- `locus deploy`
	- Reads `Locus.toml`, runs build, and prepares artifacts per `docs/toolchain/deployment.md`.

## Configuration
- `Locus.toml` controls project paths and deployment (scaffolded by `locus new`).
- Design system tokens are defined in `.locus` files under a `design_system { ... }` block.

## Debugging and troubleshooting
- Add `--debug` to `locus build` or `locus dev` for timing logs.
- Merge conflicts will report the file:line:column of the duplicate definition.
- Generator errors are wrapped with context (e.g., failing page or component name).
- If your OS file watch limit is low, consider increasing it or narrowing `--src`.

## Development
- Tech stack: TypeScript, Jest, Chevrotain, Commander.js
- Follow the development plan in `docs/development-plan.md` (TDD required):
	1. Write failing tests
	2. Verify failure
	3. Implement minimal code
	4. Verify all tests pass

## Project documentation
- Language: `docs/language/`
- Toolchain: `docs/toolchain/`
- Design System: `docs/design-system/`
- Performance notes: `docs/PERF.md`
 - Architecture overview: `docs/architecture.md`

## Performance
- Quick benchmark: `npm run bench:parser`
- Regression guard: `npm run bench:assert` (compares to `docs/perf-baseline.json`)

## Contributing
- See the open items in `docs/implementation-checklist.md` (top of file).
- Please add tests for new behavior and keep generation deterministic.

## License
MIT — see `LICENSE` and `package.json`.
