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
- [x] `page`, `component`, `store` blocks recognized by parser
  - Evidence: rules and extraction in `databaseParser.ts`, `astBuilder.ts`; tests: `tests/parser/features.test.ts`, `tests/parser/features_full.test.ts`
- [x] `state` block parsed (heuristic from original source; supports `list of X`, optionals `?`, and defaults)
- [x] `param` block parsed for components (name/type, `list of X`, optionals `?`, default values)
- [x] `action` blocks parsed (name/params/body captured as strings)
- [x] Lifecycle hooks parsed: `on load` body captured
- [x] `ui` block parsed to a structured UI AST (tags, props, expressions)
  - Evidence: `src/parser/uiAst.ts`, `src/parser/astBuilder.ts` (parseUi, transformUiTreeToStructured), tests: `tests/parser/ui_ast.test.ts`, `tests/parser/ui_ast_bind.test.ts`, `tests/parser/ui_ast_if_else_parse.test.ts`
- [x] Event directives `on:*` and `bind:value`
  - Evidence: normalized in AST builder; verified in parser and generator tests
- [x] Control flow `<if>/<elseif>/<else>` and lists `for:each`
  - Evidence: structured IfNode/ForEachNode; tests for parse and generation
Notes: We still strip feature bodies for lexing, then enrich nodes using the original source; migrate to full grammar later. Heuristics now support optionals and defaults.

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
- [x] Merge feature blocks and detect duplicates
  - Evidence: `src/parser/merger.ts`; tests in `tests/parser/merging.test.ts`, `tests/parser/merging_features_dup.test.ts`

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
 - [x] Many-to-many join table strategy per docs (implicit vs explicit) verified
  - Evidence: `src/generator/prisma.ts`; tests in `tests/generator/prisma.test.ts`, `tests/generator/prisma_many_to_many.test.ts`, `tests/generator/prisma_many_to_many_explicit.test.ts`

## Generators: React/Next.js (Phase 2.2)
- [x] Page generation to React component file string
  - Evidence: `src/generator/react.ts`; tests in `tests/generator/react.test.ts`, UI AST render tests
- [x] `state` → `useState` hooks with defaults
- [x] `on load` → `useEffect`
- [x] `action` blocks → functions
- [x] `ui` passthrough; strips `ui { ... }` wrapper when present
- [x] Component generator with props interface and UI passthrough
- [x] Event wiring (`on:*` → React props like onClick) and two-way binding (`bind:value` → value + onChange setter)
  - Evidence: `src/generator/react.ts`; tests in `tests/generator/react_ui.test.ts`
- [x] Control flow and lists: `<if>/<elseif>/<else>` → ternary chain, `for:each` → `.map(item, index)` with key
  - Evidence: `tests/generator/react_ui_ast_if_else.test.ts`, `tests/generator/react_ui_ast_render.test.ts`
- [x] Slots/children mapping to props (slot → React.ReactNode)
  - Evidence: `tests/generator/react_slots.test.ts`
- [x] Integration with UI AST (pages/components render from uiAst with fallback)
  - Evidence: `src/generator/react.ts` (renderUiAst), `tests/generator/react_ui_ast_render.test.ts`, `tests/generator/react_ui_ast_if_else.test.ts`

## Generators: Express API (Phase 2.3)
- [x] Routes per entity generated
  - Evidence: `src/generator/express.ts`; tests in `tests/generator/express.test.ts`, `tests/generator/express_crud.test.ts`
- [x] GET one, POST create, PUT/PATCH update, DELETE remove
- [x] Validation, error handling, pagination/filtering alignment with `find(where: ...)`
  - Evidence: `src/generator/express.ts`
- [x] Express app bootstrap (router mounting)
  - Evidence: `server.ts` mounts each entity router

## CLI (Phase 3)
- [x] `locus db migrate` → runs `prisma migrate dev`
- [x] `locus db studio` → runs `prisma studio`
  - Evidence: `src/cli/db.ts`; tests `tests/cli/db.test.ts`
- [x] `locus build` orchestrates parse → merge → generate → write (Prisma, Express, React)
  - Evidence: `src/cli/build.ts`; tests `tests/cli/build.test.ts`
  - Notes: Build discovers `.locus` files recursively and reads real file contents; generates Prisma schema, Express routes, and React components (UI AST-supported).
- [~] `locus dev` initial build, watcher, starts frontend/backend processes (stubs)
  - Evidence: `src/cli/dev.ts`; performs initial build and rebuild on changes; test `tests/cli/dev.test.ts`
 - [x] `locus new` scaffolds a project
  - Evidence: `src/cli/new.ts`; test `tests/cli/new.test.ts`

## Toolchain integration & deployment
  - Evidence: `src/cli/dev.ts`
 [x] Deployment guidance / outputs structuring (docs + code)
   - Evidence: docs/toolchain/deployment.md, CLI `deploy` uses `Locus.toml` and runs build

 [x] `Locus.toml` generation/usage
   - Evidence: `src/cli/new.ts` scaffolds Locus.toml; `src/config/toml.ts` parser; `src/cli/deploy.ts` reads it
## Config and project scaffold
- [ ] `Locus.toml` generation/usage
- [ ] Generated project structure (Next.js + Express folders) finalized

## Testing completeness
- [x] Parser tests for database/design_system and invalid cases
- [x] Generators tests (Prisma good; React improved with UI transforms; Express CRUD covered)
- [x] CLI tests (db/build/dev covered via mocks)
- [x] E2E fixture test: parse real `.locus` files, merge, and generate outputs
  - Evidence: `tests/cli/e2e_build.test.ts`
 
 - [x] React generator UI AST rendering tests
   - Evidence: `tests/generator/react_ui_ast_render.test.ts`, `tests/generator/react_ui_ast_if_else.test.ts`
  
 - [x] UI AST parsing tests for `ui` blocks
   - Evidence: `tests/parser/ui_ast.test.ts`

## DX and errors
- [~] Consistent error classes (parse, merge present; generator/cli errors partial)
  - Evidence: `src/errors.ts` (BuildError/GeneratorError) used in build
- [ ] Helpful diagnostics with file/line for merges and generators

## Performance and robustness
- [ ] Parser performance characterization
- [~] Deterministic/idempotent generation checks
  - Evidence: Prisma models sorted by name for stable output
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
