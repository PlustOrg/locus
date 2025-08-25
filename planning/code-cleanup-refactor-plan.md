# Code Cleanup & Refactor Plan
Status Date: 2025-08-25
Owner: (assign)
Version Scope Target: 0.5.x – 0.6.x

## 1. Objectives
- Reduce technical debt (duplicate logic, ad-hoc patterns) and improve maintainability.
- Establish consistent architecture boundaries (parser, AST, validation, generation, plugins, CLI).
- Increase test clarity & coverage for refactored modules.
- Improve developer experience (types, error messages, structure) without breaking public API (unless versioned notice).
- Lay groundwork for upcoming Auth & Theming enhancements.

## 2. Current Pain Points (Initial Assessment)
| Area | Issue | Evidence / Notes | Impact |
|------|-------|------------------|--------|
| Parser / AST | Large monolithic `astBuilder.ts` (>700 lines) mixes extraction & enrichment | Single file complexity | Hard to modify safely |
| Parser Grammar | `databaseParser.ts` very long; lacks modular token groups | Hard to navigate | Grammar changes risky |
| Express Generator | Logic for auth + routes in same file, string templates verbose | Harder to extend for guards | Medium |
| Build Orchestration | `buildOutputArtifacts` conflates generation steps | no plug points ordering | Limits extension layering |
| CLI Index | Mixed command registration ordering, plugins command appended after parseAsync call (potential bug) | Order confusion | Medium |
| Error Handling | Inconsistent error types vs plain strings | Search across `throw new Error` | Poor DX |
| Config Handling | TOML parsing duplicated in multiple places | parseToml used directly; no central config struct | Drift risk |
| Tests | Auth tests regex-match generated strings instead of functional integration | new guard tests | Brittle snapshots |
| Types | Minimal exported type surfaces for plugin context & auth | plugin types internal | Weak integration DX |
| Magic Numbers | e.g., performance thresholds, etc., inline env lookups | scattered | Hard to tune |
| Performance | No profiling hooks around parser / generator beyond plugin timings | instrumentation lacking | Unknown hotspots |
| File Naming | Mixed casing (e.g., Locus.toml vs config references) | style inconsistency | Low |
| Security | No central sanitizer / limits (size, depth) | not enforced consistently | Medium |

## 3. High-Level Architecture Target
Layers:
1. Core Model: AST types, immutable after build phase.
2. Parsing: Grammar + CST -> intermediate, then AST builder modules (split by domain: database, design system, features/ui).
3. Validation: Pure functions consuming AST, returning structured issues.
4. Generation: Modular generators (prisma, express, react, theme, next) orchestrated by a pipeline registry.
5. Extensions: Plugin hooks, auth, future theming inheritance.
6. CLI: Thin orchestration, delegating to pipeline API.

## 4. Refactor Themes
- Decompose large modules.
- Introduce interfaces & dependency injection points.
- Normalize error & warning reporting.
- Improve test harness realism (spin minimal express app when needed).
- Introduce configuration object typed `LocusConfig`.
- Instrumentation & metrics hooks.

## 5. Master Checklist

### 5.1 Module Decomposition
- [Done] Introduced modular builder files: `src/parser/builders/{databaseBuilder,designSystemBuilder,featuresBuilder}.ts`
- [Done] Added `builderUtils.ts` for shared helpers (posOf/defineHidden)
- [Done] Added `featureEnrichers.ts` for feature/page/component/store enrichment
- [Done] Added experimental orchestrator `modularAstBuilder.ts` behind env flag `LOCUS_EXP_MOD_BUILDERS=1`
- [Partial] Barrel exports in `ast/index.ts` (deferred; existing exports unchanged)
- [Partial] Extraction of relation/field attribute parsing helpers (database builder encapsulates; may further split later)
- [Deferred] Break `databaseParser.ts` into sub-parsers (kept monolithic for now)
- [Done] Style scanning already isolated (`styleScanner.ts`); documented by separation

### 5.2 Build / Generation Pipeline
- [ ] Create `generator/pipeline.ts` that registers generators (prisma, express, react, theme, next, custom)
- [ ] Refactor `buildOutputArtifacts` to iterate registry (deterministic order) instead of hard-coded sequence
- [ ] Provide `GenerationContext` with addFile(), addWarning(), metrics capture
- [ ] Move auth augmentation into a dedicated generator `authGenerator` (wraps express modifications)
- [ ] Add guard to ensure no duplicate file writes (centralized) rather than per-generator logic

### 5.3 Configuration & Env
- [ ] Implement unified `loadConfig(srcDir): LocusConfig` (merges Locus.toml + env overrides)
- [ ] Define `LocusConfig` interface (auth?, deploy?, performance thresholds)
- [ ] Replace scattered `process.env` reads with config provider
- [ ] Add validation & warnings for deprecated keys
- [ ] Provide JSON schema for `Locus.toml` (initial minimal) in `docs/reference`

### 5.4 Error & Diagnostics
- [ ] Introduce `Diagnostic` type { kind, code, message, file?, loc?, severity }
- [ ] Wrap parser & validator errors into Diagnostics list
- [ ] CLI reporter renders diagnostics uniformly (pretty|json)
- [ ] Replace direct `process.exit` in build pipeline with thrown structured error consumed by CLI
- [ ] Assign consistent codes (e.g., PARSE_*, VALIDATE_*, GEN_*, AUTH_*)

### 5.5 Testing Enhancements
- [ ] Add integration test spinning generated express server & hitting guard route (supertest)
- [ ] Replace brittle regex tests with structural assertions (parse server.ts AST or locate inserted markers)
- [ ] Snapshot only stable artifacts (manifest) reduce incidental churn
- [ ] Add performance smoke test capturing parse & generation ms (non-flaky thresholds)
- [ ] Introduce util to create temp project with config seeds (DRY test code)

### 5.6 Type & API Surface
- [ ] Export central public types via `src/index.ts` (Plugin API, Config, Diagnostics)
- [ ] Provide `.d.ts` for Request augmentation (auth) cooperatively loaded
- [ ] Strengthen plugin context types (narrow any) & document in code
- [ ] Add JSDoc comments to public interfaces

### 5.7 Security & Limits
- [ ] Add max file size / token count config (default safe limits)
- [ ] Add recursion depth limit for UI AST building
- [ ] Central sanitize routine for file names & generated paths
- [ ] Validate adapter path resolution against project root (prevent traversal)
- [ ] Add optional content hash allowlist for plugin modules (future)

### 5.8 Performance & Instrumentation
- [ ] Add high-level timing capture for parse, validate, generate phases (build meta)
- [ ] Introduce lightweight metrics collector (counts, histograms) pluggable sink
- [ ] Provide `--profile` flag to output timing JSON
- [ ] Benchmark script for end-to-end build

### 5.9 Code Quality / Style
- [ ] Enforce ESLint rule for no inline large template strings without indentation tags (or break into functions)
- [ ] Prettier config audit (consistent trailing commas?)
- [ ] Add import path sorting (eslint-plugin-import) optional
- [ ] Add commit hook (lint-staged + husky) (optional)

### 5.10 Documentation Updates
- [ ] Create architecture overview diagram (layers & data flow)
- [ ] Add ref docs: Diagnostics codes, Config schema, Generation pipeline
- [ ] Document plugin performance expectations & metrics fields
- [ ] Clarify how to extend generators via registry

### 5.11 Migration & Versioning
- [ ] Document internal refactor is non-breaking for public API (list unchanged surfaces)
- [ ] Provide fallback exports for moved modules (deprecation warnings)
- [ ] Add CHANGELOG entry summarizing refactor (once complete)

### 5.12 Tooling & Developer Experience
- [ ] Add `locus doctor` (general project health: config, plugin, auth) combining plugin doctor
- [ ] Add `--diagnostics-json` option to `dev` for machine consumption
- [ ] Provide generator to emit TypeScript type declarations for domain models (ergonomics)

### 5.13 Risk Mitigation Tasks
- [ ] Incrementally refactor modules (PR per area) to avoid large merge conflicts
- [ ] Maintain green test suite at each decomposition step
- [ ] Add temporary compatibility layer for old function names

### 5.14 Acceptance Criteria
- [ ] All checklist items complete or explicitly deferred with rationale
- [ ] Test suite expanded (target +15% coverage on generators & config)
- [ ] No increase in build time >10% baseline (record baseline before/after)
- [ ] Developer onboarding doc updated

## 6. Proposed Sequence
1. Baseline metrics (performance & test coverage)
2. Config & diagnostics foundation
3. Parser/AST decomposition
4. Generation pipeline refactor
5. Auth generator extraction
6. Types & public API surfacing
7. Security limits & performance instrumentation
8. Test harness improvements
9. Documentation & migration notes
10. Final cleanup & CHANGELOG

## 7. Metrics to Capture (Before / After)
- Parse time (ms) for representative corpus
- Generation time (ms)
- Total build time
- Lines of code per core module (reduction goal: <=300 per file)
- Cyclomatic complexity (optional) on selected modules

## 8. Open Questions
- Should plugin execution be parallelized (bounded) where safe? (defer until after refactor)
- Provide optional ESM output alongside CJS? (future)
- Do we freeze AST objects post-build for safety? (performance trade-off)

## 9. Deferred / Nice-to-Have (Not in initial scope)
- Full AST schema JSON export command
- GraphQL schema generator
- Web-based visualizer of parse tree

## 10. Change Control
Track progress by converting each checklist bullet to an issue labeled `refactor` & linking back to this plan.

---
Generated initial plan; refine, assign owners, and begin phased execution.
