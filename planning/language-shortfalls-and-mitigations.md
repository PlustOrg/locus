## Locus Language: Potential Shortfalls & Mitigation Strategies (2025-08)

Status: living assessment of the current surface (database modeling, UI syntax, application logic, workflows, plugins, generators). Each item lists: Symptom → Root Cause → Impact → Mitigation (Near-Term / Longer-Term) → Owner Hint.

### 1. Grammar Leniency & Heuristic Parsing in Workflows
**Symptom:** Branch and condition parsing rely on heuristics; complex expressions or nested braces cause early parse failures. Some placeholders (`http_request`, future delay fields) accept almost any content silently.
**Root Cause:** Incremental MVP layering prioritized fast feedback over full formal grammar extension to avoid destabilizing existing CST -> AST builder.
**Impact:** Surprising parse errors for advanced users; hard to extend reliably; risk of backward-incompatible tightening later.
**Mitigation:**
Near-Term: Add explicit Chevrotain rules for `branch` condition expression and step bodies; tighten allowed token sets; negative snapshot tests for unsupported constructs.
Longer-Term: Split workflow grammar into dedicated sub-parser with recovery disabled and publish EBNF in docs; version workflow manifest semantics separately.
Owner Hint: Parser maintainer; introduce `workflowExpression` rule and reuse Pratt parser for uniform expression shapes.

### 2. Limited Expression Semantics (No Type / Name Resolution)
**Symptom:** Expressions parsed (run arg, branch condition, forEach iterable) are syntactic only; no validation of identifiers existing in bindings/state/entities.
**Root Cause:** Type inference layer not yet implemented; AST lacks symbol tables for workflow scope.
**Impact:** Typos pass silently until runtime; weaker editor tooling (no completions / diagnostics).
**Mitigation:**
Near-Term: Build a lightweight symbol table per workflow (inputs, state, loop vars, run bindings) & warn on unknown identifiers.
Longer-Term: Introduce typed expression graph, unify with application logic expression handling; emit machine-readable diagnostics for LSP integration.
Owner Hint: Validator engineer; leverage existing binding scan (regex) to seed symbol table.

### 3. Error Span Precision Inconsistent
**Symptom:** Some validations (send_email improved) highlight correct step; others (binding shadowing, missing iterable) point at workflow name.
**Root Cause:** Builder sometimes drops token location; validation falls back to `nameLoc`.
**Impact:** Reduced usability; slows debugging; inconsistent expectation vs other Locus error fidelity.
**Mitigation:**
Near-Term: Ensure every step node includes a canonical `loc` (line, column, length) referencing the keyword token; pass through to validation errors.
Longer-Term: Introduce unified `Location` interface across all AST node kinds + invariant test: “all emitted workflow diagnostics must have length”.
Owner Hint: Add builder coverage test enumerating all `kind` tokens.

### 4. Manifest Redundancy & Raw vs Structured Drift
**Symptom:** Manifest stores both raw blocks (trigger, steps) and partial structured fields; risk of divergence in future refactors.
**Root Cause:** Hybrid evolution path; raw retained for downstream tools not yet migrated.
**Impact:** Increases diff noise and potential for bugs when interpreting manifest.
**Mitigation:**
Near-Term: Mark raw fields as deprecated in comments & docs (keep for version 2); add deterministic serializer that reconstitutes raw from structured for backward compatibility tests.
Longer-Term: Version 3 manifest removes raw textual duplicates; provide migration script & snapshot golden tests.
Owner Hint: Generator owner; add `MANIFEST_VERSION_UPGRADE.md` plan.

### 5. Concurrency Model is In-Memory & Non-Deterministic Under Parallelism
**Symptom:** Queue is per-process; restarts lose state; no persistence or distributed enforcement; timing dependent tests could flake with future async.
**Root Cause:** Minimal MVP simulation (no purpose-built scheduler).
**Impact:** Misleading production expectations; limited suitability for real workload orchestration.
**Mitigation:**
Near-Term: Document limitations prominently (already partially); add optional deterministic mode that drains queue synchronously for tests.
Longer-Term: Pluggable execution backends (in-memory | durable queue); add `concurrency { group: X, limit: N, backend: durable }` extension.
Owner Hint: Runtime engineer; abstract queue operations behind interface.

### 6. Retry Strategy Simplicity (No Jitter / Per-Step Overrides)
**Symptom:** Single global strategy; no jitter leading to thundering herd on repeated failures.
**Root Cause:** Scope reduction for MVP.
**Impact:** Poor resilience under systemic outages; limited tuning.
**Mitigation:**
Near-Term: Add optional `jitter: full|none` and `initialDelay:` fields; update validation.
Longer-Term: Per-step override: `run doThing() (retry: { max:1 })` with merged effective config.
Owner Hint: Workflow validator + runtime; keep manifest keys sorted for determinism.

### 7. Plugin API Surface Unversioned Beyond `apiVersion`
**Symptom:** Only numeric `apiVersion`; no granular capability negotiation; no deprecation lifecycle docs.
**Root Cause:** Early-stage plugin system.
**Impact:** Hard to evolve without breaking community plugins.
**Mitigation:**
Near-Term: Add capability list handshake: plugin exports `capabilities: ["workflow.steps.v1"]`.
Longer-Term: Publish semver’d plugin API spec; add deprecation warnings in reporter when a capability slated for removal.
Owner Hint: Plugin manager maintainer.

### 8. Lack of Formal Specification (EBNF / Type Schema)
**Symptom:** Docs narrative; no authoritative grammar spec or AST schema file.
**Root Cause:** Rapid iteration favored code as spec.
**Impact:** Harder onboarding, ambiguous change reviews, tooling generation blocked.
**Mitigation:**
Near-Term: Auto-generate grammar summary from Chevrotain rules into `reference/grammar.md` during build.
Longer-Term: Maintain authoritative JSON schema for manifest & AST; gate PRs with schema diff review.
Owner Hint: Tooling engineer; extend build script.

### 9. UI Syntax & State Update Semantics Hidden Mapping
**Symptom:** Setter naming convention `setX` implicit; no explicit doc on conflict or reserved names; complex derived state patterns unclear.
**Root Cause:** Convenience abstraction; missing advanced patterns section.
**Impact:** Potential collisions (`state { setCount: Integer = 0 }`) cause confusion; advanced users may misuse patterns.
**Mitigation:**
Near-Term: Validator warning for state identifiers that would conflict with generated setter or built-ins.
Longer-Term: Introduce explicit optional alias syntax: `count as counter` or configurable naming scheme.
Owner Hint: Application logic validator.

### 10. Database Relationship Foreign Key Strictness
**Symptom:** Requires explicit `<relationName>Id` scalar; no alternative naming maps; limited composite key support.
**Root Cause:** Simplicity and deterministic generation.
**Impact:** Harder integration with legacy schemas; verbose migration stories.
**Mitigation:**
Near-Term: Allow `(fk: "custom_column")` attribute on `belongs_to` and map accordingly in Prisma generation.
Longer-Term: Composite key DSL & relation rename mapping with validation of uniqueness.
Owner Hint: Generator + validator; ensure ordering determinism (sort by field name).

### 11. Missing Cross-Cutting Security Constructs
**Symptom:** Authentication guide exists; no first-class authorization rules (row / field level) at modeling layer.
**Root Cause:** Security model deferred pending language stabilization.
**Impact:** Users embed ad-hoc checks inside actions; risk of inconsistency.
**Mitigation:**
Near-Term: Design `policy` blocks attached to entity/workflow/page for allow/deny conditions (read/write) referencing roles.
Longer-Term: Static analyzer verifying policy coverage; manifest exports consolidated policy map powering generated middleware.
Owner Hint: Security design working group.

### 12. Insufficient Performance Guardrails
**Symptom:** Single lightweight perf test (50 workflows); no regression alerting on parser or generator complexity growth.
**Root Cause:** Early optimization not prioritized.
**Impact:** Invisible O(n^2) creep; slower CI & editor feedback.
**Mitigation:**
Near-Term: Add benchmarks for: (a) parsing 200 entities, (b) generating 100 pages, (c) workflow execution 1000 run steps.
Longer-Term: Integrate baseline JSON snapshots & 5% regression budget gating CI.
Owner Hint: Performance lead; reuse existing `scripts/bench_*` harness.

### 13. Raw Style/Theming DSL Fragmentation
**Symptom:** Theme tokens separate from component styling; no variable referencing in UI syntax yet.
**Root Cause:** Staged theming rollout.
**Impact:** Hard to maintain consistent design tokens inside inline styles; potential duplication.
**Mitigation:**
Near-Term: Allow `${token.name}` interpolation inside style blocks validated against design system.
Longer-Term: Typed style expression evaluation + dark-mode variant system.
Owner Hint: UI generator & validator.

### 14. Insufficient Test Coverage for Negative Edge Cases (Non-Workflow)
**Symptom:** Strong workflow negatives recently added; gaps remain for malformed entity attributes, invalid UI event syntaxes, conflicting action names.
**Root Cause:** Focus shifted to workflow feature.
**Impact:** Possible silent parse acceptance leading to downstream generator errors.
**Mitigation:**
Near-Term: Audit parser rules; add snapshot tests for each recovery point attempt (still disabled) to assert fail-fast behavior.
Longer-Term: Mutation testing pass (e.g., introduce random token deletions) measuring detection rate.
Owner Hint: QA / test engineering.

### 15. Plugin Hook Performance Visibility Limited
**Symptom:** Only simple >50ms warning; no aggregate stats or top slow hooks summary.
**Root Cause:** Minimal instrumentation.
**Impact:** Hard to diagnose cumulative latency from multiple small slow hooks.
**Mitigation:**
Near-Term: Add aggregated report (total ms per plugin) in build dry-run output when `--profile` flag set.
Longer-Term: Structured performance events stream consumable by external dashboards.
Owner Hint: Plugin manager maintainer.

### 16. Lack of Formal Versioning for Generated Artifacts (Beyond manifest v2)
**Symptom:** Prisma schema, React runtime, Express routes not tagged with artifact version meta.
**Root Cause:** Early stage; stable enough so far.
**Impact:** Hard to introspect compatibility from generated files alone; upgrade diff reasoning slower.
**Mitigation:**
Near-Term: Prepend comment header: `// locus:artifact <name>@<version>` to each generated file.
Longer-Term: Central artifact registry JSON summarizing versions & hashes for integrity checks.
Owner Hint: Generators maintainer.

### 17. Limited Observability / Logging Hooks
**Symptom:** Workflow execution log minimal (kind + v); no correlation IDs or structured timings.
**Root Cause:** Simplicity & test determinism.
**Impact:** Hard to debug complex multi-step failures; no performance profiling.
**Mitigation:**
Near-Term: Add optional `debug` mode adding timestamps & step duration (kept deterministic by seeding clock in tests).
Longer-Term: Structured telemetry export (OpenTelemetry span mapping) behind feature flag.
Owner Hint: Runtime engineer.

### 18. No Declarative Data Validation Layer (beyond schema syntax)
**Symptom:** Field constraints limited to uniqueness + optionality + default; no regex / range / custom validator declarations.
**Root Cause:** Minimal modeling surface to keep early adoption simple.
**Impact:** Validation logic leaks into actions; duplication risk.
**Mitigation:**
Near-Term: `(validate: email())` style attribute referencing built-in validators with code generation into runtime helpers.
Longer-Term: Composable validator DSL + cross-field validation blocks.
Owner Hint: Data modeling & generator team.

### 19. Action Side-Effects Untyped / Unannotated
**Symptom:** Actions have no declared effects (db read/write, network); impossible to statically reason about dependencies.
**Root Cause:** Scope reduction.
**Impact:** Harder optimization (prefetching, caching) and permission analysis.
**Mitigation:**
Near-Term: Optional effect annotations: `action saveUser() (effects: [write(User)]) { ... }` validated.
Longer-Term: Derive effect graph for dependency visualization & policy enforcement.
Owner Hint: Application logic spec lead.

### 20. Cross-File Merge Conflict Diagnostics Limited
**Symptom:** Duplicate entity/workflow names detected; but no contextual diff or multi-location reporting beyond first.
**Root Cause:** Simplicity in merger error construction.
**Impact:** Developer may need manual grep to find all duplicates.
**Mitigation:**
Near-Term: Collect all duplicate occurrences; attach as `related` diagnostics.
Longer-Term: Reporter renders side-by-side snippet list with highlight spans.
Owner Hint: Merger + reporter.

### 21. Lack of Formal Stability Guarantees (Roadmap Transparency)
**Symptom:** Users unsure which constructs are safe from near-term breaking changes.
**Root Cause:** Fast iteration period without stability policy doc.
**Impact:** Hesitation adopting features (esp. workflows & plugins).
**Mitigation:**
Near-Term: Add `STABILITY.md` classifying features: Stable / Beta / Experimental with review cadence.
Longer-Term: Semantic version gating: breaking grammar changes bump minor/major; provide codemod scripts.
Owner Hint: Project leads.

### 22. Limited Accessibility Hooks in UI Syntax
**Symptom:** UI blocks do not enforce / hint at accessible attributes (aria-*, alt text) for primitives.
**Root Cause:** Early UI DSL iteration.
**Impact:** Risk of inaccessible apps by default.
**Mitigation:**
Near-Term: Lint pass: warn if `<Image>` lacks `alt`, interactive elements lack accessible name.
Longer-Term: Accessibility contract annotations & auto-generated aria attributes from design tokens.
Owner Hint: UI tooling engineer.

### 23. No Incremental Build Dependency Graph for Workflows
**Symptom:** Any workflow change may trigger broader rebuild than necessary (unclear from context, assumed).
**Root Cause:** Incremental engine focused on data/UI resources first.
**Impact:** Slower feedback on large codebases with many workflows.
**Mitigation:**
Near-Term: Track per-workflow source file hash & only regenerate affected manifests.
Longer-Term: Full dependency graph (workflows referencing entities/actions) enabling targeted regeneration.
Owner Hint: Incremental build engineer.

### 24. Testing DSL Absence
**Symptom:** No native way to express fixture data or scenario tests within `.locus` files.
**Root Cause:** Out-of-scope for MVP.
**Impact:** Harder to keep examples + tests co-located and consistent.
**Mitigation:**
Near-Term: Add `test {}` blocks ignored in production build producing JSON test metadata.
Longer-Term: Execution harness generating Jest test stubs from declarative scenarios.
Owner Hint: DX / tooling.

### 25. Upgrade / Migration Story Not Codified
**Symptom:** Users manually adapt when grammar or manifest changes; no automated guidance.
**Root Cause:** Rapid iteration not yet requiring systemic migrations.
**Impact:** Future break risk compounds tech debt.
**Mitigation:**
Near-Term: Establish `MIGRATIONS.md`; each breaking change adds codemod script reference.
Longer-Term: Built-in `locus migrate` command scanning and auto-fixing outdated constructs.
Owner Hint: CLI maintainer.

### 26. Retry Loop Semantics Lack Backoff Timing & Jitter (Runtime)
**Symptom:** Retry implementation logs `retry_wait` with implied delay but performs no actual asynchronous wait; exponential backoff uses `Math.pow(factor, attempt)` starting at 1 without initial delay parameter.
**Root Cause:** Synchronous executor design chosen for determinism; timing not modeled.
**Impact:** Manifest suggests resilience that does not exist; production adoption could overrun downstream systems due to tight retry loops.
**Mitigation:**
Near-Term: Add `simulatedDelayMs` option in executor for test determinism & inject actual `await` in future async mode; adjust log to include effective wait.
Longer-Term: Pluggable scheduler interface with real timers + jitter policy; integrate clock abstraction for tests.
Owner Hint: Runtime engineer.

### 27. Prisma Generator Mapping Simplicity
**Symptom:** All unknown scalar types mapped to `String`; `Text` mapped to `String` with no explicit Prisma attribute; list optionality rules hard-coded; no enum or decimal precision support.
**Root Cause:** Minimal mapping table; absence of extended type metadata in AST.
**Impact:** Silent misrepresentation of domain intent; potential migration pain when adding richer types.
**Mitigation:**
Near-Term: Expand `mapType` with explicit exhaustive switch + diagnostic when encountering unknown type (fail fast instead of default String).
Longer-Term: Introduce `(precision: , scale:)` attributes and enum DSL; emit correct Prisma attributes (`@db.Text`).
Owner Hint: Prisma generator maintainer.

### 28. UI AST Transformation Heuristics (Regex-Based)
**Symptom:** UI transformation uses regex for events, for:each loops, and if/elseif/else ternary rewriting; potential false positives or missed patterns for nested tags or attributes reordering.
**Root Cause:** Early heuristic approach preceding full CST/UI AST normalization for all constructs.
**Impact:** Edge-case rendering bugs; difficult to extend features (e.g., additional directives) safely.
**Mitigation:**
Near-Term: Route all UI to `uiAst` path; retire regex transformations; add golden tests for nested conditional inside loops.
Longer-Term: Unified UI directive grammar + transformer passes (desugar to canonical AST) with explicit invariants.
Owner Hint: UI parser engineer.

### 29. Token Ordering Fragility
**Symptom:** `tokens.ts` relies on manual ordering to ensure keyword precedence over `Identifier`; adding new tokens risks subtle lex regressions.
**Root Cause:** Chevrotain matching precedence; manual maintenance.
**Impact:** Hard-to-diagnose lexing bugs when new keywords added; potential mis-tokenization leading to confusing parse errors.
**Mitigation:**
Near-Term: Add test enumerating all keyword patterns verifying they tokenize before `Identifier`; fail build on regression.
Longer-Term: Generate token list programmatically by category ordering arrays to eliminate manual reorder mistakes.
Owner Hint: Parser maintainer.

### 30. Validator Scope Gaps (Design System & Theme Cross-Refs)
**Symptom:** Design tokens validated for naming & hex format but not cross-referenced (e.g., shadow references, typography base size consistency) beyond simple checks.
**Root Cause:** Minimal initial DS validation layer.
**Impact:** Inconsistent tokens may compile but produce broken CSS theme output.
**Mitigation:**
Near-Term: Add cross-field rules (typography base size must exist, referenced weight keys must be defined) with targeted tests.
Longer-Term: Introduce dependency graph for design tokens enabling impact analysis & future theming variants.
Owner Hint: Validator engineer.

### 31. Workflow Execution Log Lacks Step Source Mapping
**Symptom:** Log entries record `kind` and minimal detail but not original step index or source line/column for correlating runtime events to code.
**Root Cause:** Simplicity of execution entries; AST node location omitted.
**Impact:** Harder debugging in multi-step workflows; tooling cannot implement “click log → highlight source”.
**Mitigation:**
Near-Term: Include `idx` and `loc` (line, col) fields in log entries pulled from step AST.
Longer-Term: Structured trace ID per workflow run + per-step span IDs for future distributed tracing.
Owner Hint: Runtime + AST builder.

### 32. Missing Security for Webhook Secret Exposure
**Symptom:** Webhook secret captured in manifest as plaintext; no hashing or environment indirection.
**Root Cause:** Direct raw inclusion for simplicity.
**Impact:** Generated artifacts risk committing secrets if user forgets to treat as placeholder.
**Mitigation:**
Near-Term: Treat `secret:` value as symbolic reference only; enforce pattern (UPPER_SNAKE) & do not inline actual secret in generated route — require env var lookup.
Longer-Term: Secret manager plugin interface mapping symbolic names to runtime retrieval.
Owner Hint: Generator & validator.

### 33. Lack of Multi-File Workflow Composition
**Symptom:** Cannot split large workflow across files (e.g., common step sequences) other than copy-paste.
**Root Cause:** Merger only concatenates distinct workflow blocks; no include/import semantics.
**Impact:** DRY violations; maintenance overhead in large orchestrations.
**Mitigation:**
Near-Term: Allow `workflow <Name> extends <BaseWorkflow>` with shallow merge of steps blocks (ordered append) and validation for cycles.
Longer-Term: Reusable named step macros and import syntax with namespace isolation.
Owner Hint: Parser + merger.

### 34. Absence of Structured HTTP Step Schema
**Symptom:** `http_request` placeholder lacks fields (method, url, headers); impossible to validate or generate code.
**Root Cause:** Deferred design.
**Impact:** Users may assume functionality exists; later semantic addition could be breaking.
**Mitigation:**
Near-Term: Explicit validation error if `http_request` used (flag as not yet implemented) unless behind experimental flag.
Longer-Term: Define schema: `http_request { method: GET, url: SomeEndpoint, headers: { ... }, body: expr }` + codegen into fetch wrapper with retry integration.
Owner Hint: Workflow feature lead.

### 35. CLI Build Feedback Limited for Workflow Changes
**Symptom:** Reporter doesn’t summarize which workflows regenerated or diff counts beyond file list.
**Root Cause:** Minimal output to keep noise low.
**Impact:** Hard to reason about incremental rebuild impact; debugging stale state slower.
**Mitigation:**
Near-Term: Add summary: “Regenerated 3 workflows (A,B,C)” after build.
Longer-Term: Diff summary (steps added/removed) and optional verbose mode JSON for tooling.
Owner Hint: CLI build engineer.

### 36. React Generation Assumes Hook Semantics Without Flexibility
**Symptom:** All state mapped to `useState`; no support for derived selectors, memoization, or effect dependency arrays beyond empty.
**Root Cause:** Simplified mapping.
**Impact:** Performance and correctness limitations for complex pages.
**Mitigation:**
Near-Term: Add `(derived: expr)` attribute for computed read-only variables rendered via `useMemo`.
Longer-Term: Abstract state backend to allow alternative runtime (signal-based) with consistent DSL.
Owner Hint: React generator maintainer.

### 37. UI Slot Auto-Addition May Hide Missing Declarations
**Symptom:** Components auto-add slot params when referenced; only warning emitted; potential silent misuse if warnings ignored.
**Impact:** API surface implicit; refactors risk breaking code when auto-add removed.
**Mitigation:**
Near-Term: Upgrade warning to validator error in strict mode; document explicit declaration requirement.
Longer-Term: Lint rule disallowing undeclared slot references unless `allowImplicitSlots` flag set.
Owner Hint: UI generator + validator.

### 38. Action Async Behavior Ambiguity
**Symptom:** Actions treated as async-by-default narratively, but generator doesn’t enforce `async` keyword; potential mismatch when awaiting non-promise values.
**Mitigation:**
Near-Term: Insert `async` keyword in generated action stubs when body contains `await` pattern.
Longer-Term: Static pass verifying all awaited identifiers correspond to async-capable functions (DB helpers, other actions).
Owner Hint: Application logic generator.

### 39. Missing LSP / Editor Integration Path
**Symptom:** No protocol for providing diagnostics/code completion externally.
**Impact:** Hard for ecosystem to build rich editor tooling; reliance on CLI only.
**Mitigation:**
Near-Term: Expose `parseAndValidateToDiagnostics(source, filePath)` API returning structured diagnostics JSON.
Longer-Term: Ship official LSP server referencing manifest + AST schema.
Owner Hint: DX / tooling.

### 40. Inadequate Handling of Large Projects (Memory Footprint)
**Symptom:** Full AST for all files resident in memory; no paging or lazy loading.
**Impact:** Potential memory pressure for very large codebases.
**Mitigation:**
Near-Term: Track aggregate AST size; warn when threshold exceeded.
Longer-Term: Introduce incremental AST cache with weak references & re-hydration from parsed file on demand.
Owner Hint: Core compiler architect.

### 41. Lack of Deterministic Ordering in Some Generator Sections
**Symptom:** React component import order for user components depends on discovery order; currently set but edge cases (slot auto-add) could reorder unpredictably.
**Mitigation:**
Near-Term: Globally sort all dynamic import lists & added slot params before emission; add snapshot tests.
Longer-Term: Central deterministic ordering utility reused by all generators.
Owner Hint: Generators maintainer.

### 42. Minimal Config Validation (config loader unconstrained)
**Symptom:** Configuration schema exists (`locus-config.schema.json`) but loader may not enforce all constraints.
**Mitigation:**
Near-Term: Validate loaded config against JSON Schema at build start; surface rich diagnostics.
Longer-Term: Versioned config schema with migration helper (auto-fix outdated keys).
Owner Hint: Config module maintainer.

### 43. Absent Telemetry on Generator Warnings Consumption
**Symptom:** Warnings captured in JSON but not aggregated for trend analysis.
**Mitigation:**
Near-Term: Count warnings by category; emit summary.
Longer-Term: Optionally export metrics endpoint or file for CI dashboards.
Owner Hint: CLI & generator pipeline.

### 44. Style Override CSS Generation Safety
**Symptom:** Style overrides include raw fragments; no sanitization or property whitelist.
**Mitigation:**
Near-Term: Basic validation against allowed CSS property regex; warn on unknown tokens.
Longer-Term: AST-based CSS parser integration for safe transformation (e.g., postcss) with config.
Owner Hint: Theme / UI generator.

### 45. Missing Internationalization (i18n) Foundations
**Symptom:** Strings embedded directly in UI/action code; no extraction mechanism.
**Mitigation:**
Near-Term: Lint rule detecting raw string literals in UI returning suggestion to wrap in `t("...")`.
Longer-Term: Provide `i18n` block & extraction CLI producing translation JSON bundles.
Owner Hint: DX / i18n lead.

### 46. Incomplete Test Coverage for Workflow Concurrency Queue Behavior
**Symptom:** Tests cover basic queue; not stress scenario with multiple interleaved groups and draining.
**Mitigation:**
Near-Term: Add test simulating > limit + sequential completions verifying FIFO ordering.
Longer-Term: Property-based tests (random enqueue/complete) verifying invariants.
Owner Hint: Workflow runtime tests.

### 47. Lack of Secure Defaults for Email (send_email)
**Symptom:** No enforcement of template or subject presence beyond existing rule; no output sanitization guidance.
**Mitigation:**
Near-Term: Require either `template` or `subject`+`body:` field; warn if template missing extension.
Longer-Term: Pluggable email renderer with safe HTML sanitizer built-in.
Owner Hint: Workflow feature maintainer.

### 48. Potential Identifier Collisions Across Domains (Entities, Components, Workflows)
**Symptom:** Same name may exist in multiple domains without consolidated conflict warning; manifests may override generated file names.
**Mitigation:**
Near-Term: Global namespace registry built during merge; emit warnings for collisions (advice on renaming).
Longer-Term: Namespacing syntax or explicit domain qualifiers.
Owner Hint: Merger & validator.

### 49. Missing Formal Hashing for Generated Artifacts (Change Detection)
**Symptom:** Incremental engine may regenerate all when partial changes; no content hash store per artifact.
**Mitigation:**
Near-Term: Compute SHA-256 of generated contents; skip write if unchanged (improves watch perf).
Longer-Term: Persist artifact hash map enabling cross-session cache.
Owner Hint: Incremental build engineer.

### 50. Limited Support for Non-PostgreSQL Targets
**Symptom:** Prisma datasource fixed to `postgresql` in generator.
**Mitigation:**
Near-Term: Surface `db.provider` in config; template datasource accordingly.
Longer-Term: Multi-provider mapping table for field types (e.g., MySQL, SQLite) with compatibility validation.
Owner Hint: Prisma generator.

---
## Prioritized Action Plan (Updated)

| Priority | Item | Rationale | Success Metric |
| -------- | ---- | --------- | -------------- |
| P0 | Error span precision (3) | DX clarity | 95% diagnostics include length & loc |
| P0 | Expression identifier validation (2) | Prevent silent logic bugs | Unknown id test suite passes |
| P0 | Retry semantics realism (26) | Avoid misleading resilience | Async-aware retry implemented + doc updated |
| P1 | Manifest redundancy plan (4) | Reduce drift | Manifest v3 draft & migration doc |
| P1 | Token ordering guard (29) | Prevent lex regressions | Token precedence test added |
| P1 | Performance benchmarks expansion (12) | Guard perf | CI gate on >5% slowdown |
| P1 | Prisma type mapping diagnostics (27) | Data correctness | Unknown type causes parse/validate error |
| P2 | Concurrency backend abstraction (5) | Future scaling | Interface + second backend stub |
| P2 | HTTP step explicit disable (34) | Avoid misunderstanding | Using http_request raises clear error |
| P2 | Accessibility lint (22) | Inclusive defaults | Lint warns on missing alt/labels |
| P2 | Aggregated plugin perf stats (15) | Insight | Profile report lists slowest plugins |
| P2 | Slot explicit declaration enforcement (37) | API clarity | Strict mode errors on implicit slots |
| P3 | Policy blocks draft (11) | Security baseline | Spec doc + parser placeholder |
| P3 | Artifact version headers (16) | Traceability | Headers present in all artifacts |
| P3 | Scheduler abstraction (26/5) | Resilience | Delay/jitter pluggable with tests |
| P3 | Global namespace collision warnings (48) | Predictability | Collision test passes |
| P3 | Config schema enforcement (42) | Stability | Invalid config fails early |

---
## Summary (Updated)
The deeper audit extends prior findings with runtime semantics (retry & concurrency), generator determinism, UI transformation robustness, token precedence, and security/data correctness concerns. Addressing the P0 and P1 groups early will harden correctness without large architectural upheaval, while laying groundwork for richer semantic analysis, resilient orchestration, and safer extensibility.

---
## Prioritized Action Plan (Suggested Next 90 Days)

| Priority | Item | Rationale | Success Metric |
| -------- | ---- | --------- | -------------- |
| P0 | Error span precision (Item 3) | Core DX differentiator | 95% diagnostics have length & step loc |
| P0 | Expression identifier validation (Item 2) | Prevent silent logic bugs | Unknown identifier test suite passes |
| P1 | Manifest redundancy plan (Item 4) | Avoid tech debt before growth | Manifest v3 draft & migration doc |
| P1 | Plugin capability negotiation (Item 7) | Future-compatible ecosystem | Capabilities table in plugin manifest |
| P1 | Performance benchmarks expansion (Item 12) | Guard against regressions | CI fails on >5% parse slowdown |
| P2 | Retry jitter + per-step overrides (Item 6) | Improve resilience | Config options documented & tested |
| P2 | Accessibility lint (Item 22) | Inclusive defaults | Lint warns on 3 exemplar cases |
| P2 | Duplicate diagnostics related spans (Item 20) | Faster conflict resolution | Multi-location reporter snapshot |
| P3 | Policy blocks draft (Item 11) | Security baseline | Spec doc + parser placeholder |
| P3 | Artifact version headers (Item 16) | Traceability | Headers present in all generated files |

---
## Tracking & Governance
Create GitHub labels: `lang:spec`, `dx:error-spans`, `perf:baseline`, `plugin:capabilities`, `accessibility`, `policy-dsl`. Each mitigation issue links back to this doc. Revisit quarterly; update date stamp at top.

---
## Summary
The current Locus surface delivers strong clarity in core modeling and early workflow orchestration, but needs structured advances in semantic validation, error precision, specification formalization, and performance guardrails to scale confidently. Addressing the highlighted P0/P1 items early will reduce cumulative refactor cost and unlock richer tooling (LSP, codemods, policy enforcement) while preserving the project’s core promise: world-class developer experience through explicitness and deterministic feedback.
