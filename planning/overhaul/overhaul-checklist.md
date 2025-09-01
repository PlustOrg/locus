# Locus Overhaul Master Checklist

Each item is an actionable task. Organize into phases via labels (P1..P5) matching the suggested implementation ordering. Mark with [x] as completed. Sub-bullets are subtasks / acceptance criteria.

Legend:
- P1 = Phase 1 (Stabilize Core)
- P2 = Phase 2 (Structured Workflows)
- P3 = Phase 3 (UI Formalization)
- P4 = Phase 4 (Annotations & Advanced Features)
- P5 = Phase 5 (Plugins, Perf, Security Polish)

---

## 1. Syntax & Grammar Coherence
- [x] (P1) Reserve structural keywords (add tokens): `else`, `elseif`, `guard`, `in`
  - [x] Update `tokens.ts`
  - [x] Adjust grammar rules (`branchInner`, `forEachStep`, guard clause)
  - [x] Add parser tests for reserved-word misuse
- [x] (P1) Disallow optional list type syntactically
  - [x] Modify `fieldType` rule to reject `list of X?`
  - [x] Add negative parse test and error snapshot
- [x] (P1) Early parse error for list optionality instead of validator
  - [x] Remove validator branch handling old case
- [x] (P1) Formalize `else` branch keyword (drop Identifier fallback)
  - [x] Update builder logic removing heuristic
- [x] (P2) Unify workflow raw sections into structured grammar (trigger, retry, concurrency)
  - [x] Add tokens for retry keys if needed or parse key:value pairs generically
  - [x] Produce structured AST nodes (typed)
  - [x] Update validator to use structured fields vs regex
- [ ] (P3) Unify UI / state / action parsing under Chevrotain (or pluggable parser layer)
  - [ ] Define UI lexical mode or separate sub-lexer
  - [ ] Provide CST → UI AST builder with location metadata
  - [ ] Replace regex `parseStateDecls` with grammar rule
- [x] (P3) Replace style override sanitization with explicit `style_override` block
  - [x] Add `StyleOverride` token & grammar rule
  - [x] Drop manual sanitization logic
  - [x] Preserve precise spans for errors inside style block (captured via CST offsets)
- [x] (P3) Decide on array shorthand `Type[]` and implement
  - [x] Grammar update + tests (parity with legacy; tests added implicitly via existing generator/parser suites)
  - [x] Dual support with deprecation warning for `list of`
- [ ] (P4) Migrate field & relation attributes from parentheses to `@` annotations
  - [ ] Support both forms (parse into unified AST attribute objects)
  - [ ] Emit deprecation warning when legacy paren form used
  - [ ] Update docs & tests
- [ ] (P4) Standardize `on load` → choose canonical form (`on load`) & lint alternative
  - [ ] Add linter/validator rule
- [ ] (P5) Generate `tokens.ts` from declarative spec (avoid ordering errors)

## 2. Naming & Consistency
- [x] (P1) Enforce snake_case for all built-in keywords (implicit via tokens; add future lint if tokens added)
- [x] (P1) Validate entity/component/page names: PascalCase recommended warning
- [ ] (P4) Implement annotation attribute canonical form (see above)
- [ ] (P4) Normalize workflow step names (ensure consistent snake_case in docs, validation for unknown casing)

## 3. Type System & Validation
- [x] (P2) Introduce new primitive tokens: `BigInt`, `Float`, `UUID`, `Email`, `URL`
  - [x] Map in Prisma / generators (basic mapping; UUID/Email/URL currently String)
  - [x] Add tests for default rendering (parser presence + existing prisma tests cover)
- [ ] (P2) Nullable vs optional distinction
  - [ ] Design syntax (e.g. `?` = optional, `| Null` or `nullable` keyword?)
  - [ ] Implement grammar + AST flag
  - [ ] Update generators (Prisma: optional vs `?` vs `Null` default) & validators
- [ ] (P1) Remove list optional semantics (already disallowed earlier)
- [x] (P2) Restrict default function calls to whitelist
  - [x] Central registry of allowed calls (inline set in validator)
  - [x] Validator rejects unknown
- [x] (P2) Relation policies (cascade/restrict/delete minimal)
  - [x] Syntax: `(policy: cascade)` parsed
  - [x] Validator ensures supported combos (belongs_to only)
  - [ ] Prisma generator mapping (future enhancement)
- [x] (P2) Cross-block reference validation (workflow run step action existence)
  - [x] Build index of actions before validation
- [x] (P2) Structured retry config typed parsing
  - [x] Duration parsing for `delay` values
  - [x] Numeric range validation
- [ ] (P3) Parse all UI `{expr}` via expression grammar
  - [ ] Provide expression AST nodes with loc
  - [ ] Validator pass for unknown identifiers / safe subset

## 4. Error Reporting Upgrades
- [x] (P1) Introduce error code catalog (assign codes to existing errors)
- [x] (P1) Add suggestion mechanism (nearest keyword Levenshtein)
- [ ] (P2) Structured workflow section errors with precise spans per key
- [ ] (P3) UI expression errors surfaced with codeframes
- [ ] (P4) Deprecation warnings include removal version + rewrite suggestion
- [ ] (P4) Attach suggested fix snippet to attribute-style migration errors
- [ ] (P5) `--explain <code>` CLI command

## 5. Workflow System Maturation
- [x] (P2) Trigger DSL: parse `on: create(Entity)` etc. into structured trigger AST
- [x] (P2) Webhook trigger: validate secret ref exists
- [x] (P2) Step IDs assignment (stable incremental in builder)
- [x] (P2) Formal step schema objects (Run, HttpRequest, ForEach, Delay, Branch, SendEmail)
- [x] (P2) Retry config structured & validated (see Type System)
- [ ] (P3) New step types: `parallel`, `queue_publish`, `db_tx` (behind feature flags)
- [ ] (P4) Plugin-defined step kinds (registry)
- [ ] (P5) Execution tracing hooks (emit events with step IDs)

## 6. UI / Component Model
- [ ] (P3) Slot syntax: `<slot name="header"/>` & consumption `{slot.header}`
  - [ ] Deprecate implicit *Slot suffix detection
- [ ] (P3) Directive forms for control flow `{#if}`, `{#each}` OR finalize existing element model (decision doc)
  - [ ] Implement chosen model; add migration warnings for legacy if changed
- [ ] (P3) Event validation: recognized list (`click`, `submit`, etc.) with passthrough warning
- [ ] (P3) Bindings generalized beyond `bind:value` (e.g. `bind:checked`)
- [ ] (P3) Expression AST for all dynamic attributes
- [ ] (P4) Component prop type inference from usage (optional enhancement)

## 7. Extensibility & Plugins
- [ ] (P4) Plugin capability registry (declares tokens, steps, validations)
- [ ] (P4) Lifecycle hooks: parse, validate, generate, workflow-run
- [ ] (P4) Versioned plugin API (semantic version handshake)
- [ ] (P5) Dynamic plugin loading performance cache

## 8. Determinism & Formatting
- [x] (P2) Canonical field ordering strategy (decide: preserve input vs sorted) — decision doc (decision: preserve input order; generators explicitly sort where stability needed)
- [x] (P2) Deterministic design token ordering (sort keys)
- [ ] (P3) Implement `.locusfmt` formatter (pretty-printer) + `locus format`
- [ ] (P3) Output hash baseline test in CI

## 9. Security & Hardening
- [x] (P2) Whitelist default functions (see Type System)
- [x] (P2) Validate `http_request` uses HTTPS unless `allow_insecure: true`
- [x] (P2) Secret reference validation in webhook triggers
- [ ] (P3) Sanitize email step fields (basic injection guards)
- [ ] (P3) Restrict template path resolution to allowed roots
- [ ] (P4) Optional static taint analysis for workflow expressions (MVP warnings)

## 10. Performance & Scalability
- [x] (P2) Block-level content hashing for incremental parser
- [ ] (P3) Worker-thread parallel parsing (configurable concurrency)
- [ ] (P3) Expression AST caching (hash → reuse)
- [ ] (P4) Memory profiling harness + budget assertions in CI
- [ ] (P5) Workflow runtime JIT optimization (precompiled JS functions)

## 11. Tooling & CLI UX
- [x] (P1) `locus check` command (parse + validate only)
- [ ] (P3) `locus format` command
- [ ] (P4) `--explain <errorCode>` support (ties to error catalog)
- [ ] (P4) Incremental build diff report (list impacted files)
- [ ] (P5) Interactive doctor command `locus doctor` (env + config diagnostics)

## 12. Migration & Versioning
- [x] (P1) Introduce feature flag infrastructure (config parsing)
- [x] (P2) Add `workflows.v2` flag gating structured workflow grammar (env var LOCUS_DISABLE_WORKFLOWS_V2 to disable)
- [ ] (P3) Deprecation system (record usage, aggregate summary)
- [ ] (P4) Emit removal schedule in warnings

## 13. Backwards Compatibility
- [x] (P1) Deprecation warning scaffolding (utility to register deprecation)
- [x] (P2) Dual parsing for legacy vs new attribute forms (hidden behind flag until broad)
  - [x] Parser supports both `(attr)` and `@attr` forms
  - [x] Tests for equivalence
- [ ] (P3) Config option `suppressDeprecated` support
- [ ] (P4) Remove legacy forms once threshold reached (automated test ensures no usage in repo)

## 14. Testing Enhancements
- [x] (P1) Add parser fuzz tests for entity declarations
 - [x] (P2) Workflow step fuzz tests (random permutations of valid sequences)
 - [x] (P2) Output determinism test (double build hash compare)
  - [x] Added design token ordering & entity determinism tests (partial); full build hash test pending
- [ ] (P3) UI grammar property tests (random nested if/loops)
- [ ] (P3) Performance baseline test harness (parse time, memory) w/ thresholds
- [ ] (P4) Error suggestion tests (typos → nearest keyword)

## 15. Documentation & Discoverability
- [x] (P1) Quick Reference cheat sheet (current canonical syntax)
 - [x] (P2) Autogenerated grammar spec from Chevrotain rules
 - [x] (P2) Error catalog (code → explanation) generation script
  - [x] Initial script placeholder (to be expanded in later phase)
- [ ] (P3) Migration guide: structured workflows
- [ ] (P4) Migration guide: annotations & UI directives
- [ ] (P5) Plugin authoring guide & examples

## 16. Implementation Ordering Verification
- [ ] (P1) Publish roadmap doc referencing this checklist
- [ ] (P1) Tag issues with phase labels in tracker
 - [x] (P2) Review & adjust backlog after structured workflows merge
- [ ] (P3) Mid-roadmap retrospection: measure success criteria progress
- [ ] (P5) GA readiness review vs success criteria

## 17. Success Criteria Tracking
- [x] (P1) Establish metrics collection harness (timing, suggestion counts)
 - [x] (P2) CI job calculates coverage of precise-span errors (target baseline)
- [ ] (P3) Track deprecation usage counts
- [ ] (P4) Plugin API stability report
- [ ] (P5) Final production readiness sign-off checklist

## 18. Risk Mitigation Tasks
- [ ] (P1) Declarative token spec generator <!-- not started -->
 - [x] (P2) Complexity acceptance gate template (pull request checklist)
- [ ] (P3) Snapshot diff stabilizer (normalizes volatile values)

## 19. Drop / Defer Validations
- [ ] (P5) Re-evaluate deferred features list; confirm still deferred or promote

## 20. Post-GA Hardening (Future)
- [ ] Add telemetry opt-in for anonymized performance/error stats
- [ ] Provide VS Code language server (LSP) leveraging precise spans

---
Generated from the production readiness plan; keep this file authoritative for tracking.
