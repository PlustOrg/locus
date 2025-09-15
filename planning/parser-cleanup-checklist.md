# Parser Cleanup & Refactor Checklist (Structure/Formatting Only)

Goal: Improve `src/parser/` code organization, readability, and reuse without altering runtime logic or observable AST/output. All existing tests must remain green. Where functionality lacks direct test coverage, add minimal tests before refactoring to lock behavior. No semantic changes.

## Core Principles
- Zero behavior change (AST shape, property names, hidden fields, errors, warnings, hashes).
- Snapshot/manifest & downstream generator/validator tests must still pass.
- Any extracted helper must be pure (no hidden side-effects) and unit-tested if non-trivial.
- Keep environment flag semantics (e.g., `LOCUS_AST_POOL`, `LOCUS_CST_CACHE`, workflow/env gating) untouched.
- Maintain performance (no additional passes over large strings unless negligible or cached).

## Inventory Summary
Files reviewed:
- `index.ts` (parse entry, caching, type alias extraction, flat entity exposure)
- `databaseParser.ts` (Chevrotain grammar; large, monolithic)
- `modularAstBuilder.ts` (CST -> AST modular builder plus workflow & upload extraction)
- `builders/` (database/designSystem/featuresLegacy/helpers)
- `expr.ts` (expression parser + constant folding + cache)
- `uiParser.ts` & `uiAst.ts` (UI markup to structured AST)
- `preprocess.ts` (feature block extraction & body stripping)
- `styleScanner.ts` & `extractStyles.ts` (style:override scanning)
- `typeAliases.ts`, `builderUtils.ts`, `tokenGen.ts`, `tokens.ts`

## High-Level Refactor Targets
1. Consolidate repeated primitive token name lists across builders & grammar helpers.
2. Extract common CST token-to-text slicing utilities (currently inline in multiple files: `sliceFrom`, `extractText`, manual offset loops in `modularAstBuilder` & `featuresLegacy`).
3. Group workflow-specific CST to AST logic into a dedicated module (`workflowBuilder.ts`) from `modularAstBuilder.ts` to shrink file size.
4. Isolate upload policy CST extraction into `uploadBuilder.ts` similarly.
5. Standardize naming for location helpers (`posOf`, `defineHidden`) & expose a small facade `astUtils.ts` (import path stability via re-export to avoid churn).
6. Normalize option/flag checks (e.g., `process.env.LOCUS_DISABLE_WORKFLOWS_V2`) behind functions (`isWorkflowsV2Enabled()`) to clarify intent & ease future toggles.
7. Deduplicate state parsing code appearing for Page vs Store in `featuresLegacy.ts` (structured + fallback raw). Extract to `parseStateBlockNodes()` in a new `stateHelpers.ts`.
8. Extract repeated UI attribute normalization logic patterns (if any duplication found while implementing state helpers) – currently primary logic centralized already; likely no-op.
9. Introduce a central array/object for primitive type tokens & mapping to DRY up `mapPrimitiveToken`, scalar type detection inside grammar-related walkers.
10. Ensure expression parser cache functions (`_clearExprCache`) documented & optionally guard with size limit (no behavior change: keep unlimited but TODO comment).
11. Introduce lightweight unit tests for untested modules (see Coverage Gaps) prior to refactor.
12. Consistent file headers and section delineation comments for large files (`databaseParser.ts`).
13. Run a formatting pass (respect existing style; minimal whitespace & trailing space cleanup only where safe).
14. Guarantee no accidental change to Chevrotain rule names (affects test lookups) – add a test enumerating rule names before/after.
15. Add a hashing test of concatenated sorted rule names + token names to detect grammar drift (baseline captured before refactor).

## Coverage Gaps (Need Tests First)
- `preprocess.extractFeatureBlocks` (add test verifying extraction for page/component/store with nested braces & multiple blocks)
- `styleScanner.scanStyles` (test multi-style blocks, unterminated block flag)
- `extractStyles.attachComponentStyles` (interaction test ensuring last block becomes `styleOverride`)
- Upload CST extraction (currently only indirectly tested via validator/generator; add focused test for AST shape of uploads with maxSize, maxCount, mime list, required flag, storage options)
- Workflow structured retry/concurrency parsing corner cases (negative numbers via hyphen tokens; unknown entries capture). Existing tests cover many; ensure targeted snapshot-like assertion for internal `_unknownEntries`.
- Type alias application (alias resolution flagged with `aliasResolved` & `aliasOf` properties) – add test locking behavior.

## Detailed Task List

### Phase 0: Baseline Guard
- [x] Add test: `parser/grammar_rule_names.test.ts` capturing current rule name list & token name list hash.
- [x] Add test: `parser/type_alias_resolution.test.ts` verifying alias resolution fields.
- [x] Add test: `parser/preprocess_blocks.test.ts` for `extractFeatureBlocks` & `preprocessSource` invariants.
- [x] Add test: `parser/style_scanner.test.ts` for multi + unterminated style blocks.
- [x] Add test: `parser/extract_styles_integration.test.ts` ensuring `attachComponentStyles` merges last style block.
- [x] Add test: `parser/upload_cst_extraction.test.ts` verifying upload policy AST nodes from single file.
- [x] Add test: `parser/workflow_retry_concurrency_extras.test.ts` verifying negative max/factor, unknown entries, durations parsed.

### Phase 1: Shared Utilities
- [x] Create `src/parser/astUtils.ts` re-exporting `posOf`, `defineHidden` (leave originals; import sites migrate gradually).
- [x] Create `src/parser/cstText.ts` with `sliceFromCst(node, source)` and `extractTextSpan(node, source)` and unit tests.
- [x] Replace inline copies in `featuresLegacy.ts` (`sliceFrom`) & `modularAstBuilder.ts` (`extractText`) referencing new helpers (keep old functions temporarily exporting wrappers to avoid large diff; remove after tests pass).
- [x] Introduce `primitiveTypes.ts` exporting `PRIMITIVE_TOKEN_NAMES`, `PRIMITIVE_TO_NAME`, and helper `detectPrimitiveToken(childrenDict)` used in `databaseBuilder.ts` and others. (Partial: constants & detect function added; integration into builders deferred to Phase 4.)

### Phase 2: Workflow & Upload Modularization
- [x] Extract workflow CST -> AST logic from `modularAstBuilder.ts` into `workflowBuilder.ts` (pure functions: `buildWorkflowBlocks(nodes, source)` returning array of workflow blocks). Maintain environment flag gating inside `workflowBuilder`.
- [x] Extract upload policy CST logic into `uploadBuilder.ts` (function `buildUploadPolicies(nodes, source)`).
- [x] Update `modularAstBuilder.ts` to delegate and slim to orchestrator + basic loops.
- [x] Ensure no change to resulting AST by re-running full test suite & rule/token hash test.

### Phase 3: State & Feature Deduplication
- [x] Create `stateHelpers.ts` with `parseStructuredStateDecl(cstNode)`, `parseRawStateDecls(innerSource)`, and unify logic used for pages and stores.
- [x] Refactor `featuresLegacy.ts` to consume helpers; remove duplicated logic blocks while preserving output property names & ordering.
- [x] Add unit test specifically asserting parsed state arrays equality before/after refactor (store + page sample). Use snapshot or deep-equality fixture.

### Phase 4: Primitive & Attribute DRY
- [ ] Refactor `mapPrimitiveToken` & primitive detection in `databaseBuilder.ts` to use shared constants from `primitiveTypes.ts`.
- [ ] Extract attribute building logic duplication detection (if any additional duplication found beyond helpers.ts) – if none, document rationale in code comment.
- [ ] Add test verifying that all primitives produce identical `primitiveCodeOf` codes for a sample entity set pre/post refactor (hash comparison of serialized entity types).

### Phase 5: Cleanup & Formatting
- [ ] Apply consistent section comments (e.g., `// === Workflow Grammar ===`) in `databaseParser.ts` only (no rule renames).
- [ ] Remove obsolete inline TODOs superseded by roadmap (retain behavior-related TODOs).
- [ ] Ensure all new utility modules have JSDoc boundary comments explaining pure nature & no side effects.
- [ ] Run formatter (or minimal whitespace cleanup) – ensure grammar hash test still passes.

### Phase 6: Final Guards
- [ ] Re-run full test suite with environment variations (`LOCUS_AST_POOL=1`, `LOCUS_CST_CACHE=1`, `LOCUS_DISABLE_WORKFLOWS_V2=1`, `LOCUS_ENABLE_EXPERIMENTAL_STEPS=1`) in matrix (add a test script or manual doc instructions).
- [ ] Confirm no increase in parse time (add micro-benchmark comparing `__getParseCount` & average parse duration over sample corpus; acceptable delta <= 3%).
- [ ] Update `docs/development/development-plan.md` adding note about new parser utility modules & hash guard test.
- [ ] Add README note referencing grammar drift guard test & how to intentionally update baseline.

## Risk Mitigations
- Keep extra wrapper exports until after each phase passes; remove in a separate small commit.
- Hash-based tests ensure no silent AST drift.
- Pure helpers avoid global state; any caching uses existing env-guarded caches.

## Deferred / Out-of-Scope
- Actual grammar simplification or rule renaming (would break baseline hash test) – future effort.
- Performance optimizations beyond trivial dedup (e.g., worker-thread parsing).
- Rich expression grammar (stays minimal).

## Tracking
Progress markers: change `[ ]` to `[x]` as tasks complete. Baseline tests (Phase 0) must all be green before structural refactors begin.
