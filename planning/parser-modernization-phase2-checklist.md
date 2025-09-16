# Parser Modernization – Phase 2 Cleanup & Hardening Checklist

Objective: Systematic, behavior-preserving cleanup and infrastructure improvements following initial rename / consolidation (Phases B–F complete). This phase focuses on modularity, determinism, type safety, diagnostics quality, and future-proofing. All tasks default to "NO grammar / semantic behavior change" unless explicitly marked as a future (intentional) baseline update.

Legend:
- [ ] = Not started  |  [ ] (⚠ baseline) = Intentionally causes hash / snapshot change  |  [x] = Done
- Keep hash guard tests green except where a task is explicitly flagged (⚠ baseline) and coordinated.

## Prioritized Execution Order (High-Level)
1. Token category & primitive detection refactor (Grammar & Tokens group, G1–G4).
2. Attribute extraction & state parsing consolidation (AST & Helpers, A3 + H2).
3. Modular grammar file split (Structure, S1–S3).
4. Generated tokens + grammar spec & snapshot (Grammar, G1 + T2 + D1).
5. Location+factory layer & readonly dev freeze (AST, A1 + A4).
6. Performance instrumentation & caching improvements (Perf, P1–P4) then remove legacy instrumentation (D2).
7. Expanded hashing / tooling guards (Testing, T1–T4, Automation AU2).
8. Remaining documentation & type-safety hardening (Docs, Type, Automation).
9. Optional experimental pathways (Migration / Experimental EX group).

---

## S. Structure & Modularity
- [ ] S1 Split monolithic grammar (`databaseParser.ts`) into feature modules: `grammar/core`, `grammar/designSystem`, `grammar/ui`, `grammar/workflow`, `grammar/upload`.
- [ ] S2 Introduce aggregator `locusCstParser.ts` that composes feature rule sections (constructor calls only).
- [ ] S3 Add `parser/index-internal.ts` re-exporting internal modules; limit public `parser/index.ts` surface.
- [ ] S4 Add ESLint rule / custom check disallowing deep imports outside allowed barrels (Automation cross-ref AU1).

## G. Grammar & Tokens
- [ ] G1 (Preparatory) Define token metadata table (name, pattern, longerAlt, categories) and generate `tokens.ts` (codegen script) – no pattern changes.
- [ ] G2 Auto-build `AllTokens` ordering from table; verify deterministic sort (explicit priority field for conflicts).
- [ ] G3 Introduce `PrimitiveType` token category; mark all primitive tokens as members.
- [ ] G4 Refactor primitive detection to category scan; remove `detectPrimitive` linear scan (retain tests; primitives hash unchanged).
- [ ] G5 Normalize keyword token naming convention (decide suffix: `Kw` vs `Tok`) – (⚠ baseline) requires token hash update & test re-baseline.
- [ ] G6 Collapse legacy list parsing (`List` / bracket variants) behind a single rule with deprecation warning flag (retain both until D2 removal).
- [ ] G7 Add guard in hash test validating naming regex for keyword tokens.

## A. AST Building & Object Construction
- [ ] A1 Introduce `astFactory.ts` with pure factory functions returning fully-initialized nodes.
- [ ] A2 Add DEV freeze option: if `process.env.LOCUS_DEV_FREEZE==='1'` deep-freeze AST nodes (conditionally; perf neutral in prod).
- [ ] A3 Consolidate attribute extraction (field + relation) into single generic `collectAttributes(kind, allowed)` walker.
- [ ] A4 Implement uniform `loc(tokenOrNode)` helper: returns `{ file, line, column, length }` standard shape.
- [ ] A5 Replace remaining ad-hoc hidden property definitions with typed symbol keys (e.g. `SYM_LOC`, `SYM_INTERNAL`).
- [ ] A6 Define discriminated CST node visiting types (ambient types or generated) to remove pervasive `any` casts.
- [ ] A7 Add invariant checks post-build (dev only) – e.g. list nodes always have `of`, no optional list, relation has target identifier.

## H. Utilities & Helpers
- [ ] H1 Decide final fate of `astUtils.ts`: delete OR repopulate with stable façade exporting only `loc`, `defineHidden`, factories.
- [ ] H2 Merge `stateHelpers` raw vs structured logic into unified normalizer producing identical output (add property-based parity test T3).
- [ ] H3 Remove duplicated `usedLegacyList` branches after deprecation window (coordinate with G6 & D2).

## E. Error & Diagnostics Enhancements
- [ ] E1 Centralize keyword / identifier suggestion engine (Levenshtein + context map) in `diagnostics/suggestions.ts`.
- [ ] E2 Add structured quick-fix suggestion objects (foundation, not surfaced yet) – no user-visible change.
- [ ] E3 Introduce consistent parse error adaptor that rewrites Chevrotain messages into canonical form (guard unchanged wording via snapshot test T4).
- [ ] E4 Implement dev-only invariant diagnostic aggregator (ties to A7) – collects & reports after build.

## P. Performance & Determinism
- [ ] P1 Reuse single `LocusCstParser` instance across parses (add `reset()` wrapper) under `PARSER_REUSE=1` flag; benchmark.
- [ ] P2 Add builder micro-benchmark (`bench_builders.ts`) measuring allocations & time per entity.
- [ ] P3 Cache primitive mapping on CST nodes via a non-enumerable symbol (after G3/G4) – ensure no memory leak.
- [ ] P4 Document performance baselines (tokens/sec, alloc/entity) in `perf-baseline.json` update (no behavioral diff).
- [ ] P5 Remove instrumentation exports once corresponding tests refactored to internal measurement API (depends on test updates).

## T. Testing & Tooling
- [ ] T1 Expand hash guard: include token category names, count of rule names, sorted rule signature checksum.
- [ ] T2 Add snapshot test for generated grammar spec (`scripts/generate_grammar_spec.ts`).
- [ ] T3 Property-based test (fast-check) verifying raw vs structured state parsing parity (supports H2).
- [ ] T4 Snapshot test for normalized parse error messages (after E3) – assert stability.
- [ ] T5 Add test asserting no deep internal imports outside approved barrels (lint / custom rule integration).
- [ ] T6 Add test verifying factories produce frozen objects when `LOCUS_DEV_FREEZE=1`.

## D. Documentation & Maintenance
- [ ] D1 Auto-generate Markdown grammar specification (rule list, referenced tokens, first/follow sets) – consumed by T2.
- [ ] D2 Publish migration note for removal of legacy list syntax & instrumentation exports.
- [ ] D3 CONTRIBUTING update: “Adding a token / rule / attribute” golden path.
- [ ] D4 Developer doc for performance flags (`PARSER_REUSE`, `LOCUS_DEV_FREEZE`).

## Y. Type Safety
- [ ] Y1 Introduce `StrictToken` type wrapper (non-optional positional properties) + adapt builders.
- [ ] Y2 Branded `PrimitiveName` type ensuring only valid primitives appear in AST (post G3).
- [ ] Y3 Replace implicit string unions in attributes with explicit `enum` or discriminated union objects.
- [ ] Y4 Add type-level assertion tests (tsd or compile-time fixtures) for factory return types.

## R. Dead Code & Simplification
- [ ] R1 Remove `usedLegacyList` / dual path after deprecation (ties to G6/H3; (⚠ baseline) if grammar adjusted).
- [ ] R2 Inline single-use trivial helpers; mark remaining utilities with `@public` / `@internal` JSDoc tags.
- [ ] R3 Prune any now-unused builder instrumentation & pools if benchmarks show negligible benefit.

## AU. Automation & Precommit
- [ ] AU1 ESLint rule or custom script to forbid deep `parser/` imports (except whitelisted).
- [ ] AU2 Precommit hook: run token generation + grammar spec + hash guard + lint; reject if uncommitted drift.
- [ ] AU3 Add Makefile / npm script alias `npm run parser:regen` chaining codegen & spec.

## EX. Experimental / Future (Flagged – not default path)
- [ ] EX1 `PARSER_EXPERIMENTAL=1` mode to enable modular grammar split while legacy mode stays hashed (intermediate testing).
- [ ] EX2 Investigate incremental parsing (content-hash block reuse) – design doc only (no code yet).
- [ ] EX3 Worker-based parallel parsing prototype (bench-only; behind flag; no test reliance).
- [ ] EX4 Explore expression grammar unification (migrate existing expression handling into Chevrotain) – (⚠ baseline) large surface.

## Dependency & Sequencing Notes
- G1→G4 precede removal of `detectPrimitive` logic referenced in builders.
- A3 depends on existing attribute tests; add parity assertions before removal of old helpers.
- H2 + T3 must land together to guarantee identical state outputs.
- E3 should precede T4 snapshot; commit message must justify any wording shift.
- P5 only after new internal measurement path added (could be hidden dev logger or benchmark harness).
- R1 only after D2 migration note published & a release boundary defined.

## Risk Mitigation
- Each structural refactor (S1/S2, G1, A1) gated by: (1) full test run, (2) manual grammar spec diff, (3) hash guard unchanged unless flagged.
- Introduce feature flags (env-based) for behavior that could regress perf (P1, A2) – default off in CI.
- Keep commits narrow: one major refactor or codegen introduction per commit; include rationale in body.

## Tracking Summary (Flat List for Quick View)
- [ ] S1  Split grammar modules
- [ ] S2  Aggregator parser
- [ ] S3  Internal index barrel
- [ ] S4  Lint deep import guard
- [ ] G1  Token metadata table & generator
- [ ] G2  Auto-build AllTokens
- [ ] G3  Primitive token category
- [ ] G4  Category-based primitive detection
- [ ] G5  Normalize keyword token naming (⚠ baseline)
- [ ] G6  Unified list parsing w/ deprecation
- [ ] G7  Keyword naming guard in hash test
- [ ] A1  AST factory layer
- [ ] A2  Dev freeze option
- [ ] A3  Unified attribute walker
- [ ] A4  `loc()` helper
- [ ] A5  Symbol hidden props
- [ ] A6  Typed CST node interfaces
- [ ] A7  Invariant checks
- [ ] H1  `astUtils` decision
- [ ] H2  Unified state parsing
- [ ] H3  Remove legacy list branch (post deprecation)
- [ ] E1  Suggestion engine centralization
- [ ] E2  Quick-fix scaffolding
- [ ] E3  Parse error adaptor
- [ ] E4  Invariant diagnostic aggregator
- [ ] P1  Parser reuse flag
- [ ] P2  Builder micro benchmark
- [ ] P3  Primitive mapping cache
- [ ] P4  Perf baseline update
- [ ] P5  Remove instrumentation exports
- [ ] T1  Expanded hash guard
- [ ] T2  Grammar spec snapshot test
- [ ] T3  State parity property test
- [ ] T4  Parse error snapshot
- [ ] T5  Deep import test
- [ ] T6  Freeze behavior test
- [ ] D1  Generated grammar spec doc
- [ ] D2  Migration note (list + instrumentation)
- [ ] D3  CONTRIBUTING parser section
- [ ] D4  Perf flags doc
- [ ] Y1  StrictToken type
- [ ] Y2  Branded primitive name type
- [ ] Y3  Attribute union refinement
- [ ] Y4  Type-level assertion tests
- [ ] R1  Remove legacy list path (⚠ baseline)
- [ ] R2  Inline trivial helpers / JSDoc tags
- [ ] R3  Remove unused pools
- [ ] AU1 Lint deep imports
- [ ] AU2 Precommit regen pipeline
- [ ] AU3 Regen convenience script
- [ ] EX1 Experimental modular mode flag
- [ ] EX2 Incremental parsing design doc
- [ ] EX3 Worker parallel parsing prototype
- [ ] EX4 Expression grammar migration (⚠ baseline)

---

End of Phase 2 planning checklist. Update this file as items are completed; keep commit messages explicit (prefix with the item code, e.g. `G3: introduce PrimitiveType token category`).