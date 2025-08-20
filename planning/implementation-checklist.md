# Locus Implementation Checklist — Open Items

Last audited: 2025-08-18

Legend: [x] Done • [~] Partial • [ ] Planned/Not Implemented

This file tracks only incomplete items and enhancements. Completed items have been removed for focus.

## Dev experience and robustness
- [x] Dev watcher: recursive discovery, add/unlink/rename handling, and debounce rebuilds
  - Evidence: `src/cli/dev.ts` adds recursive chokidar watch, on(add|change|unlink) handlers, and createDebounce
- [x] Real process integration stubs with env override
  - Evidence: `src/cli/dev.ts` provides spawnNext/spawnApi with LOCUS_NEXT_CMD override and generated server.ts fallback, plus npm script fallback
- [x] Graceful shutdown (SIGINT/SIGTERM) and cleanup
  - Evidence: `src/cli/dev.ts` registers signal handlers to close watcher and kill child procs
- [x] Cross-platform spawn compatibility
  - Evidence: `spawnSafe` uses shell on Windows; tested via mocks in `tests/cli/dev.test.ts`

## Diagnostics and observability
- [x] Precise file/line/column in merge errors and contextual generator errors
  - Evidence: AST now carries sourceFile and nameLoc; merger includes file:line:col; generators wrapped in GeneratorError with names
- [x] Structured logs and a `--debug` flag for CLI commands (verbose timings)
  - Evidence: buildProject accepts debug and prints timing JSON; dev prints per-event timings when debug is enabled

## Performance
- [x] Incremental caching for dev: cache AST per file and rebuild merged outputs on changes
  - Evidence: `src/cli/incremental.ts` maintains cache; update/remove drive rebuilds
- [x] Parallelize generation where safe (per entity/page/component) with a small worker pool
  - Evidence: `src/cli/build.ts` uses pLimit(4) to parallelize Express route and React file writes with sorted inputs; `safeMkdir`/`safeWrite` support mocked environments

## Language and validation enhancements
- [x] Strict validation for design_system values (color hex, token naming)
  - Evidence: `src/validator/validate.ts` enforces hex colors, token keys, baseSize units, and weight ranges; called in build
- [x] Feature grammar: richer action signatures
  - Evidence: `src/parser/databaseParser.ts` supports typed action params (`name(param: Type?)`); AST builder extracts params

## Generators
- [x] Theming: CSS variables from design_system colors
  - Evidence: `src/generator/theme.ts` + build writes `generated/assets/theme.css`
- [x] Form bindings support for bind:value
  - Evidence: React generator maps `bind:value` to value/onChange with state setters (UI AST + string transform)
- [x] Express API: standardized query params and basic validation
  - Evidence: `src/generator/express.ts` checks skip/take/id number types and validates where JSON
- [x] Typed props mapping for components
  - Evidence: `src/generator/react.ts` maps primitive types (string/number/boolean/json/slot) to TS types
- [x] Next.js scaffolding (app/ routing and layout)
  - Evidence: `src/generator/next.ts` + build writes `next-app/app/*` wrappers around generated React pages; theme.css at out root

## Tooling & packaging
- [x] ESLint + Prettier configuration and CI checks
  - Evidence: `.eslintrc.json`, `.eslintignore`, `.prettierrc`, `npm run lint` and `format` scripts
- [x] GitHub Actions CI: test matrix (Node versions + OS), include `npm run bench:assert`
  - Evidence: `.github/workflows/ci.yml` runs build, test, bench across Node 18/20 and OSes
- [x] Publish workflow to npm (semantic versioning, tags), and Conventional Commits
  - Evidence: `.github/workflows/release.yml` publishes on v* tags using NPM_TOKEN; `.github/workflows/semantic-pr.yml` enforces semantic PR titles
- [x] Issue/PR templates and CODE_OF_CONDUCT.md/CONTRIBUTING.md
  - Evidence: `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`

## Documentation
- [x] Expanded README with end-to-end example
  - Evidence: `README.md` includes example, CLI, structure, performance, contributing
- [x] Contributor guide
  - Evidence: `CONTRIBUTING.md` with testing and style guidance
- [x] Troubleshooting section
  - Evidence: `README.md` Debugging/Troubleshooting section with tips

## Testing
- [x] Windows CI run
  - Evidence: CI matrix includes windows-latest
- [x] Incremental builder tests: add/update/remove cases and error path
  - Evidence: `tests/cli/incremental.test.ts`
- [x] Snapshot tests for generated React components and Express routes
  - Evidence: `tests/generator/snapshots.test.ts` with Jest snapshots

