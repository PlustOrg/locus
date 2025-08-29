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
