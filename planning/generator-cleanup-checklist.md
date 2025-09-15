# Generator Module Cleanup & Structural Refactor Checklist

Goal: Improve structure, readability, and maintainability of `src/generator/` without changing runtime/output logic. All transformations must be strictly refactors (no behavior change). Every affected behavior must remain covered by tests before and after refactor. Where coverage is missing, add tests first (red/green with no code changes) before refactoring.

Scope: Files in `src/generator/`:
- `pipeline.ts`
- `express.ts`
- `prisma.ts`
- `react.ts`
- `next.ts`
- `theme.ts`
- `validation.ts`
- `uploads.ts`
- `stabilize.ts`
- `outputs.ts`

Non‑Goals:
- No new features or flags.
- No change to generated file names, contents (other than benign formatting: whitespace normalization that existing tests ignore / snapshot neutral).
- No performance optimization beyond trivial DRY helpers (avoid measurable behavior deltas).

## 1. Baseline & Coverage Audit
[] List all existing tests touching generator output (grep `tests/generator/` & related validator/workflow tests referencing generated artifacts).
[] For each generator module, map current coverage status:
   - express: `express.test.ts`, `express_crud.test.ts`, `express_plural.test.ts` (route CRUD + pluralization)
   - prisma: `prisma.test.ts`, relation tests, unique/map/default tests
   - react (pages/components/runtime): multiple `react_*.test.ts`, snapshot + binding & slot tests
   - next: `next_presence.test.ts` (presence), maybe coverage for global CSS (verify)
   - theme: `theme_generation.test.ts`, `theme_multi_ordering.test.ts`, design token ordering tests
   - uploads: (Check) existing tests? If none: add test for wildcard MIME expansion & index barrel creation
   - validation: validation schema tests (`validation/*` test folder) already assert fields & defaults
   - pipeline: `pipeline_duplicate_file.test.ts`, build manifest tests, dead code elimination warnings tests
   - stabilize: (Check) If missing explicit test, add `stabilize_content.test.ts` verifying redaction patterns
[] Identify uncovered logic blocks:
   - Upload wildcard expansion uniqueness
   - `stabilizeContent` regex redactions
   - Auth utilities generation in `express.ts` (JWT helper code) (add minimal snapshot test)
   - Legacy optional warning step (already covered by `legacy_optional_warning.test.ts`)
[] Add missing tests BEFORE refactor (ensure green baseline).

## 2. Planned Structural Improvements (No Logic Change)
Provide atomic refactor steps; each step followed by full test run.

### 2.1 Shared Utility Extraction
 [x] Create `src/generator/_shared.ts` containing pure helpers reused across modules:
   - `sortByName<T extends { name: string }>(arr: T[]): T[]` (returns shallow copy sorted)
   - `pluralize()` (migrate from `express.ts` unchanged)
   - `kebabCasePageName()` (from `next.ts`, extracted)
   - `stableJSONString(obj)` (wrapper around `JSON.stringify(obj, null, 2)` for consistency)
   - Re-export `withHeader` (import from `outputs.ts`) for pipeline steps (optional; ensure no cycle)
 [x] Replace in-module duplicate sorting logic with calls to shared functions (express, prisma, next, pipeline updated).

### 2.2 Express Generator Decomposition
 [x] Split `generateExpressApi` into:
   - `buildEntityRouteModule(entity, options)` – returns source string (no side effects)
   - `buildServerBootstrap(mounts, options)` – builds `server.ts`
   - `emitAuthUtilities(authConfig)` – isolated JWT utilities string (if applicable)
 [x] Move pluralization/guard/auth string assembly into small pure functions.
[x] Preserve exact route ordering & whitespace (added safety snapshot `express_route_snapshot.test.ts`).

### 2.3 Pipeline Modularization (Lightweight)
 [x] Extract each step object into its own file under `src/generator/steps/`.
 [x] Central registry file `steps/index.ts` exporting ordered array `builtinSteps` (same order preserved).
 [x] Keep `runPipeline` signature identical; adjust import path.
 [x] Maintain parallelization code (phase arrays) in `pipeline.ts`.
[] Add a test ensuring step order unchanged: generate manifest hash before & after refactor on fixed input.

### 2.4 React Generator Readability Pass
 [x] Factor nested helper functions (`transformUi`, `transformIfElse`, `renderElement`, etc.) into separate file `reactTransforms.ts` (pure, exported).
 [x] Keep exports from `react.ts` stable; re-export if necessary (no API change).
 [x] Add interface types for UI AST nodes in shared file -> `uiAstTypes.ts` (no shape change).

### 2.5 Validation Generator Simplification
 [x] Extract `ruleFromField` & `applyConstraints` into `validationRules.ts`.
 [x] Replace in-place duplication of update/patch schema building with helper `cloneAllOptional(schema)`.
 [x] Ensure generated module text identical (hash verified).

### 2.6 Uploads Generator Clarification
 [x] Extract wildcard MIME expansion logic to helper (`expandMimeList`).
 [x] Add pre-refactor test capturing expansion & uniqueness (already present) – still green.
 [x] Keep JSON output stable (test passed).

### 2.7 Theme & Next Generators Minor DRY
 [x] Use shared `sortByName` where applicable.
 [x] Extract `kebabCasePageName` & use (already in next generator).
 [x] Add optional note comment decision: skipped to avoid snapshot risk.

### 2.8 Stabilize Function Test & Lock
 [x] Add dedicated test verifying all regex replacements; ensure no ordering change.
 [x] Freeze doc comment (no further edits planned).

## 3. Safety & Verification Steps
 [x] Before each refactor step: baseline hashes captured for validation & express snapshot.
 [x] After refactor: recomputed key hashes (validation module, express routes) unchanged.
 [x] Add a utility test `generator_output_hash_stability.test.ts` with baseline hash recorded.
[] Ensure environment-flagged behaviors (`LOCUS_DEAD_CODE`, `LOCUS_PARALLEL_GEN`, `LOCUS_BUILD_CACHE`, `LOCUS_WARN_LEGACY_OPTIONAL`) still produce identical artifacts & warnings under test harness.

## 4. Documentation Updates
 [x] Add a short `docs/toolchain/generator-architecture.md` describing new modularization.
 [x] Reference environment flags related to generator in that doc.

## 5. Final Quality Gate
[] Run full test suite (all green).
[] Lint & format pass.
[] Manual spot check of key generated files (Prisma schema, one React page/component, express route, server bootstrap, theme.css, workflow manifest, upload policy) to confirm no unintentional whitespace or ordering regressions.
[] Remove any leftover dead code or obsolete comments flagged during review (avoid altering emitted strings).

## 6. Post-Refactor Opportunities (Deferred / Not In This Pass)
- Introduce template literals with parameterized route/action definitions (future readability improvement).
- Configurable code style (formatter integration) for generated files.
- AST-driven React UI diff generation (beyond current textual transforms).

---
Implementation Strategy: Execute sections 2.1 → 2.8 sequentially; never batch multiple modules in one commit without intermediate test run. If any snapshot diverges, revert and isolate cause.

Tracking: Mark each checklist item `[x]` upon completion; do not collapse sections until final gate passes.
