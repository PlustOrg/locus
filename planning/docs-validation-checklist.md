# Docs Validation Test Checklist

Purpose: Track automated tests that assert the examples and claims in `docs/` remain accurate. Status legend: [ ] not started, [P] planned, [Done] implemented, [N/A] not applicable (doc purely conceptual), [TBD] unresolved spec.

## Core Language & Modeling
- [ ] language/philosophy.md: Intro sample compiles (basic page/component example parses)
- [ ] language/language.md (if present elsewhere) -> (cross-link integrity)
- [ ] language/application-logic.md: Action + state examples parse; actions generate callable functions
- [ ] language/data-modeling.md: Entity + field/relations examples produce expected Prisma schema (has_many, belongs_to, has_one, defaults, unique, map, list of primitives)
- [ ] language/ui-syntax.md: UI examples parse to UI AST (elements, attributes, text, if/for, slots, children, bind:value)

## Design System
- [ ] design-system/styling.md: Token assignment examples parse; invalid examples rejected (hex, typography weights, spacing etc.)
- [ ] design-system/theming.md: Multiple theme color tokens generate CSS variables per theme; typography + spacing tokens reflected in CSS

## Guides
- [ ] guides/getting-started.md: Minimal sample end-to-end build (database + page + component) generates expected file set (prisma schema, express server, optional next app when page present)
- [ ] guides/authentication.md: Any referenced auth-related configuration either flagged as TODO or test asserts absence (if not implemented)
- [ ] guides/data-relationships.md: Relationship examples generate correct Prisma relation fields & foreign keys (belongs_to optional vs required)

## Plugins
- [ ] plugins/index.md: Listed plugin types (react, express, prisma, next, theme) exist in generator directory
- [ ] plugins/overview.md: Example plugin structure (if code snippet) compiles or placeholder test ensures NOT IMPLEMENTED marker
- [ ] plugins/blueprints.md: Blueprint examples (e.g., CRUD) generate expected express routes & React components
- [ ] plugins/typescript-plugins.md: Any API surface referenced (hooks, lifecycle) cross-checked; unimplemented items flagged (see Unimplemented section)

## Toolchain / CLI
- [ ] toolchain/cli.md: Each documented command (build, dev, incremental, new, deploy, db, reporter) has a CLI test verifying exit code & key output
- [ ] toolchain/cli.md: --no-warn suppresses warnings file
- [ ] toolchain/cli.md: errorFormat=json produces structured JSON error
- [ ] toolchain/deployment.md: Assertions limited to currently implemented deploy features (placeholder if not implemented)
- [ ] toolchain/development-workflow.md: Incremental build scenario test (modify component; stale warnings removed)

## Reference & Architecture
- [ ] reference/architecture.md: Core layers (parser, merger, validator, generators) existence & exported symbols
- [ ] reference (general): Project AST shape matches documented interfaces

## Additional Cross-File Integrity
- [ ] All code-fenced locus snippets parse without error (parameterized test scanning docs)
- [ ] All code-fenced shell command snippets either succeed (safe subset) or are skipped with annotation
- [ ] All relative markdown links resolve (no dead links)
- [ ] All mentioned file paths exist or are flagged

## Generated Output Assertions
- [ ] CSS variable generation matches examples (theme switching data-theme attr)
- [ ] React component slot auto-add warnings appear as documented (children / named slot)
- [ ] Style override examples produce separate CSS file and import statement

## Performance (If claimed)
- [ ] PERF.md or docs performance claims validated against perf-baseline.json thresholds (parser time, generation time)

## Unimplemented / Speculative (Documented but Not Yet Fully Implemented)
- [ ] Plugin lifecycle hooks beyond existing generators (typescript plugin API specifics)
- [ ] Advanced authentication flows (JWT/session middleware) if described
- [ ] Deployment automation steps (if referencing infrastructure tooling not present)
- [ ] Complex theming inheritance (if cascading theme references described)
- [ ] Store advanced features (selectors, derived state, middleware) if mentioned
- [ ] Any security hardening steps (prototype pollution guards beyond basic key sanitization) not yet present

## Test Harness Utilities To Add
- [ ] Markdown snippet extractor utility
- [ ] Helper to run parse+build on extracted snippet set
- [ ] Link integrity checker (relative paths)
- [ ] Doc drift detector (labels lines that reference non-existent flags / commands)

## Process
1. Implement snippet extraction & parsing (baseline smoke) -> mark language/ui/design system items [P].
2. Add targeted expectation tests per doc section.
3. Add negative tests for invalid examples (ensure validator rejects).
4. Populate Unimplemented section dynamically in future (compare doc claims vs feature registry).

## Status Summary
(Initial creation – all unchecked)
