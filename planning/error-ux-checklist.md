# Error UX Checklist (Compiler + CLI)

Objective: Ensure all user-facing errors are clear, actionable, and consistently rendered with precise locations and helpful context—from parse to validate to generate—across build and dev flows.

## A. Frontend (Lexer + Parser + AST Builder)

- [x] Lexer errors: include length where available and wrap as `PError` with file, line, column, length.
  - Implemented: best-effort length propagates from lexer into `PError` (defaults to 1 when unknown).
- [x] Parser errors: always compute `length` from token offsets and throw `PError` (present). Added tests for common cases (Colon, LCurly, Identifier) to validate codeframe span.
- [x] CST→AST: ensure all primary identifiers carry location for user-facing names via hidden props (e.g., `nameLoc`).
  - Implemented: added `nameLoc` for fields and relations (plus `targetLoc`), in addition to existing entity/page/component/store.

## B. Merger

- [x] Replace `MergeError` with `LocusError` (`code: 'merge_error'`) to unify reporting and codeframes when loc exists.
  - Implemented: `MergeError` now extends `LocusError` and includes file/loc; existing tests pass.
  - Duplicate detection includes file and loc for entities/pages/components/stores.

## C. Validator

- [x] Ensure all validation failures use `VError` with file/line/column when loc is available.
  - Implemented: design_system token naming reports loc when available; tests added for loc presence.
- [x] Add targeted validations emitting precise locations for duplicate names within a single scope (duplicate field names in an entity).
  - Implemented with `nameLoc` and covered by tests.

## D. Generators

- [x] Wrap internal generator errors in `GeneratorError` with a `cause`. If `cause` is a `LocusError`, surface via reporter (build path should recognize it).
  - Ensure generator error messages include context (e.g., component/page name) and suggestions when actionable.
  - Add tests covering a simulated generator failure and expected message shape.

## E. CLI Orchestration (build/dev/incremental)

- [x] Build: for any error, if `instanceof LocusError` or has `code`, call `reportError` and `process.exit(1)`; avoid raw stacks.
  - Implemented for parse/validate/merge/generator errors.
- [x] Dev: never exit on errors; always render via `reportError` and keep watching.
  - Implemented: unwraps `cause` and reports.
- [x] Incremental: preserve `LocusError` on init/update; don’t wrap unless necessary.
  - Implemented: passthrough on init/update.

## F. Reporter UX

- [x] Friendly headings mapped from `code`: Parse Error, Syntax Error, Validation Error, Merge Error.
  - Implemented: Merge Error case added.
- [x] Chevrotain message simplification already present; extend humanization map (e.g., Equals, LBracketTok, RBracketTok).
- [x] Codeframe includes previous and next lines; caret plus squiggle for `length` (present). Verified gutters by inspection.
- [x] Optional footer tips for common mistakes (e.g., “Add a colon between name and type: name: String”).
- [x] Tests: snapshot/regex reporter outputs using a fake `fileMap` and crafted errors.

## G. Test Coverage Additions

- [x] Parser error snapshots: missing colon, unexpected string, unexpected '}'.
- [x] Merge duplicate name errors include file and line/column.
- [x] Validator location for design_system tokens.
- [x] Build exits with code 1 on `LocusError`; Dev continues watching on errors.

## H. Documentation

- [x] Add “Common Errors & Fixes” section in docs/guides or update getting-started with real examples.
- [x] Update CONTRIBUTING.md: Always throw `LocusError` family for user-facing failures and include location.

## I. Optional Enhancements

- [x] Simple suggestions for parse errors (e.g., did you mean ':'?).
- [x] JSON output mode for editor integrations.
- [x] Broaden token humanization and colorization polish.
