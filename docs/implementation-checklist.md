# Locus Implementation Checklist

Last audited: 2025-08-15

This checklist maps the documentation requirements to the current codebase. Each item is marked as Done, Partial, or Deferred, with short evidence pointers.

Legend: [x] Done • [~] Partial • [ ] Deferred/Not Implemented

## Project hygiene and foundations
- [x] TypeScript config: strict mode, outDir/rootDir, Node/Jest types
  - Evidence: `tsconfig.json`
- [x] package.json scripts and deps (ts-jest, jest, chevrotain, commander)
  - Evidence: `package.json`
- [x] Tests present for parser, generators, CLI
  - Evidence: `tests/parser/**`, `tests/generator/**`, `tests/cli/**`
- [x] CLI bin mapping and build
  - Evidence: `package.json` bin, `src/index.ts`, `npm run build`

## Language: database block (docs/language/entities.md)
- [x] Field types: String, Text, Integer, Decimal, Boolean, DateTime, Json
  - Evidence: tokens and parser in `src/parser/tokens.ts`, `databaseParser.ts`; AST in `src/ast/index.ts`; tests in `tests/parser/database.test.ts`
- [x] Optional marker `?` on types
  - Evidence: AST `FieldType.optional`; tests cover optional
- [x] Attributes: `(unique)`
  - Evidence: parser+AST builder; tests
- [x] Attributes: `(default: <literal|call(...)>)`
  - Evidence: AST `FieldAttributeDefault`; tests include `now()`
- [x] Attributes: `(map: "db_col")`
  - Evidence: AST `FieldAttributeMap`; tests
- [x] Relationships: `has_many`, `belongs_to`, `has_one`
  - Evidence: parser rules and AST `Relation`; tests include all
- [x] Many-to-many via `has_many` on both sides
  - Evidence: parser acceptance; implied in Prisma gen mapping
- [x] Self-referential relations
  - Evidence: parser acceptance; tests include example
- [x] Invalid syntax throws parser error
  - Evidence: `LocusParserError` in `src/parser/index.ts`; test case present

## Language: design system (docs/design-system/*)
- [x] `design_system` block parsing
  - Evidence: rules in `databaseParser.ts`, AST in `src/ast/index.ts`, tests in `tests/parser/design_system.test.ts`
- [x] Colors themes and tokens
- [x] Typography (fontFamily, baseSize, weights)
- [x] Spacing, Radii, Shadows token maps
- [x] Nested themes handled

## Language: features (docs/language/features.md, ui-syntax.md)
- [~] `page`, `component`, `store` blocks recognized by parser (names only)
  - Evidence: minimal rules in `databaseParser.ts`, AST builder stores names; tests in `tests/parser/features.test.ts`
- [ ] `state` block parsed to AST (variables, types, defaults)
- [ ] `param` block parsed for components (with defaults)
- [ ] `action` blocks parsed (params/body)
- [ ] Lifecycle hooks parsed: `on load`, `on unload`
- [ ] `ui` block parsed to UI AST (tags, props, expressions)
- [ ] Event directives `on:*` and `bind:value`
- [ ] Control flow `<if>/<elseif>/<else>` and lists `for:each`
- Notes: For Phase 1, feature bodies are stripped by `src/parser/preprocess.ts` to keep parsing focused; full feature parsing is deferred.

## Parser implementation details
- [x] Lexer tokens for keywords, punctuation, literals, comments/whitespace
  - Evidence: `src/parser/tokens.ts`
- [x] Grammar rules for database and design_system; features minimal
  - Evidence: `src/parser/databaseParser.ts`
- [x] CST → AST builder for database/design_system; features minimal
  - Evidence: `src/parser/astBuilder.ts`
- [~] Preprocessing used only as a temporary bridge for features
  - Evidence: `src/parser/preprocess.ts` (to be removed when full feature grammar is added)
- [x] Parser error class and messaging
  - Evidence: `LocusParserError` in `src/parser/index.ts`

## AST merging (Phase 1.4)
- [x] Merge database entities across files
- [x] Detect duplicate entity names and throw
- [x] Merge design system tokens/weights (shallow)
- [~] Merge feature blocks and detect duplicates
  - Evidence: `src/parser/merger.ts`; tests in `tests/parser/merging.test.ts`

## Generators: Prisma (Phase 2.1)
- [x] Header (`generator client`, `datasource db` with env URL)
- [x] Model field type mapping (String/Text→String, Integer→Int, Decimal, Boolean, DateTime, Json)
- [x] Optional fields with `?`
- [x] Attributes mapping: `@unique`, `@default(...)`, `@map("...")`
- [x] Default primary key: `id Int @id @default(autoincrement())`
- [x] Relations mapping:
  - [x] `has_many`: array fields
  - [x] `belongs_to`: relation + scalar fk + `@relation(fields, references)`
  - [x] `has_one`: optional relation
- [~] Many-to-many join table strategy per docs (implicit vs explicit) verified
  - Evidence: `src/generator/prisma.ts`; tests in `tests/generator/prisma.test.ts`

## Generators: React/Next.js (Phase 2.2)
- [~] Page generation to React component file string
  - Evidence: `src/generator/react.ts`; test in `tests/generator/react.test.ts`
- [~] `state` → `useState` hooks with defaults
- [~] `on load` → `useEffect`
- [~] `action` blocks → functions
- [~] `ui` passthrough (no real UI AST transform yet)
- [ ] Event wiring (`on:*`), two-way binding (`bind:value`), control flow, lists, slots to JSX
- [ ] Integration with real parsed AST (currently uses a simplified page shape in tests)

## Generators: Express API (Phase 2.3)
- [~] Routes per entity generated (GET list present)
  - Evidence: `src/generator/express.ts`; test in `tests/generator/express.test.ts`
- [ ] GET one, POST create, PUT/PATCH update, DELETE remove
- [ ] Validation, error handling, pagination/filtering alignment with `find(where: ...)`
- [ ] Express app bootstrap (router mounting)

## CLI (Phase 3)
- [x] `locus db migrate` → runs `prisma migrate dev`
- [x] `locus db studio` → runs `prisma studio`
  - Evidence: `src/cli/db.ts`; tests `tests/cli/db.test.ts`
- [~] `locus build` orchestrates parse → merge → generate → write
  - Evidence: `src/cli/build.ts`; tests `tests/cli/build.test.ts`
  - Notes: Current build reads file names and relies on mocked parser in tests; real file content reading and recursive discovery are pending.
- [~] `locus dev` initial build, watcher, starts frontend/backend processes (stubs)
  - Evidence: `src/cli/dev.ts`; test `tests/cli/dev.test.ts`

## Toolchain integration & deployment
- [~] Development workflow alignment (watch-rebuild stubs present)
  - Evidence: `src/cli/dev.ts`
- [ ] Deployment guidance / outputs structuring (docs + code)

## Plugins (docs/plugins/*) — Deferred per plan
- [ ] Blueprint generator command (`locus generate from <repo>`) and plugin interfaces

## Config and project scaffold
- [ ] `Locus.toml` generation/usage
- [ ] Generated project structure (Next.js + Express folders) finalized

## Testing completeness
- [x] Parser tests for database/design_system and invalid cases
- [~] Generators tests (Prisma good; React minimal; Express minimal)
- [~] CLI tests (db/build/dev covered via mocks)
- [ ] E2E fixture test: parse real `.locus` files, merge, and generate outputs

## DX and errors
- [~] Consistent error classes (parse, merge present; generator/cli errors TBD)
- [ ] Helpful diagnostics with file/line for merges and generators

## Performance and robustness
- [ ] Parser performance characterization
- [ ] Deterministic/idempotent generation checks
- [ ] Incremental build (dev) beyond stub

## Packaging and docs
- [~] CLI bin configured; `npm link` readiness
  - Evidence: `package.json` bin
- [ ] README with quickstart, commands, troubleshooting
- [ ] Changelog/versioning (optional)
- [x] License/repo metadata in package.json

---

### Summary
- Core parsing for database and design_system: Done.
- Minimal recognition for features (page/component/store names): Partial; full feature parsing deferred.
- Generators: Prisma solid; React/Express minimal; expand per spec.
- CLI: db/build/dev implemented with tests; build/dev need deeper integration (real file reading, recursive discovery, richer outputs).

Use this as a living document and update statuses as features land.
