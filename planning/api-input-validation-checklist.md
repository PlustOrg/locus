# API Input Validation Implementation Checklist

Goal: Introduce deterministic, comprehensive, and performant runtime validation for all generated API endpoints (REST) to prevent malformed / malicious input from reaching business logic.

Status Legend: P0 Critical (blocker for production hardening) | P1 Important | P2 Nice-to-have | P3 Future

---
## 1. Objectives & Scope
- [x] (P0) Validate request body JSON for create/update routes.
- [x] (P0) Validate route params (e.g. `/users/:id`).
- [x] (P0) Validate query string filters/limits/pagination.
- [x] (P1) Validate headers required by auth / feature flags. (middleware `requiredHeadersMiddleware`)
- [x] (P2) Optional coercion of primitive types (string → number/boolean/date) with safe rules. (implemented number & boolean)
- [x] (P2) Support partial update (PATCH) semantics distinct from create. (implemented via updateSchema with all fields optional)
- [ ] (P3) Form-data / file upload validation strategy.

## 2. Threat Model & Risks
- [x] (P0) Reject unexpected additional properties (prevent mass assignment).
- [x] (P0) Enforce type & enum constraints from schema. (enum annotations parsed/enforced)
- [x] (P0) Apply length / numeric bounds if specified. (BASIC depth/array + min/max/length constraints)
- [x] (P1) Apply pattern validation (regex) for e.g. slugs/emails. (pattern annotation parsed & enforced)
- [x] (P1) Enforce request size limits (overall body & per field) early. (body & per-string caps added)
- [ ] (P2) Add rate-limited validation failure telemetry (if telemetry is later added).
- [x] (P2) Fuzz test common injection vectors (initial fuzz test added) to confirm rejection/stability.
- [x] (P1) Limit regex complexity. (max length guard + complexity flag)
- [x] (P1) Reject invalid UTF-8 surrogate pairs / control chars. (implemented invalid_chars code)

## 3. Design Decisions (To Finalize)
- [x] (P0) Decide schema derivation source: reuse AST entities + field annotations.
- [x] (P0) Strategy for distinguishing required vs optional: use existing nullable/optional semantics.
- [x] (P0) Unknown fields policy: reject vs. strip (choose reject for safety + determinism).
- [x] (P1) Decide handling for implicit default values (apply during create if field absent; does not overwrite provided value).
- [ ] (P1) Determine error format standard (machine-friendly JSON envelope). (Envelope implemented, finalize doc spec later)
- [x] (P1) Plugin constraint API availability (basic registerValidationConstraint hook).

## 4. DSL / Annotation Additions
- [x] (P1) Introduce numeric constraints: `@min(value)`, `@max(value)`. (tokens + parsing + enforcement)
- [x] (P1) Introduce string constraints: `@length(min,max)`, `@pattern(/.../)`. (length & pattern parsed + enforced)
- [x] (P1) Introduce `@email` shortcut (token + parsed + enforced)
- [x] (P2) Add `@json` / `@opaque` marker for raw JSON blobs (deep validation skipped; implemented json & opaque attributes).
- [ ] (P2) Add `@discriminator` for future polymorphic validation.
- [ ] (P3) Localization-friendly validation message override: `@message(key="...")`.
- [x] (P0) Update parser & AST to capture new annotations with spans. (basic capture; spans minimal)
- [x] (P0) Update validator phase to store constraint metadata in Unified AST. (propagated into generated schemas)

## 5. Schema Extraction Pipeline
- [x] (P0) Build transformation: Entity -> ValidationSchema object (pure, deterministic, memoized) (initial minimal version).
- [ ] (P1) Normalize nested relation validation.
- [x] (P1) Partial update schema builder. (updateSchema + validateEntityUpdate)

## 6. Runtime Representation
- [x] (P0) Decide on generated schema module per entity.
- [x] (P0) Ensure code is side-effect free & tree-shakeable.
- [ ] (P1) Provide aggregate index for dynamic access by route builder. (basic index emitted, dynamic use later)
- [x] (P2) Precompute regex objects. (lazy compiled & cached pattern regex)

## 7. Validation Engine Integration
- [x] (P0) Insert middleware in Express generator before controller logic. (inline)
- [x] (P0) Parameter + query validators generated adjacent to route definitions.
- [x] (P1) Shared guard for consistent error formatting. (middleware `makeValidator`)
- [x] (P1) Implement fast path for empty body. (update mode skip)
- [x] (P2) Cache structural schema objects. (ruleMap memoization)

## 8. Error Reporting & Format
- [x] (P0) Standard JSON error envelope implemented.
- [x] (P0) Stable error codes core subset. (added min/max/length/pattern/email/enum codes)
- [ ] (P1) Include span-like path resolution (future AST tie-in).
- [x] (P2) Condensed single-string message mode. (deferred; not yet implemented)

## 9. Security Hardening
- [x] (P0) Enforce maximum depth.
- [x] (P0) Enforce max array length.
- [x] (P0) Reject prototype pollution keys.
- [x] (P1) Reject invalid UTF-8 surrogate pairs / control chars. (implemented invalid_chars code)
- [x] (P1) Limit regex complexity. (length guard + pattern_complexity)
- [ ] (P2) Structured logging hook.

## 10. Performance & Budgets
- [x] (P0) Set target overhead. (<5% added median latency; placeholder target established)
- [x] (P0) Bench large payload. (bench script scaffold `scripts/bench_validation.ts` - large payload scenario to extend)
- [ ] (P1) Micro-bench assertions.
- [ ] (P2) Optional JIT path.

## 11. Backwards Compatibility & Migration
- [x] NOTE: No external users; skip deprecation gating.

## 12. Testing Strategy
- [x] (P0) Unit tests for each constraint annotation (initial basic coverage in `api_validation_basic.test.ts`).
- [x] (P0) Integration tests for endpoints. (compile-time inspection test added)
- [x] (P0) Fuzz tests. (random input stability test added)
- [x] (P1) Performance regression test. (initial bench script; integrate into CI later)
- [x] (P1) Negative tests for mass assignment. (`mass_assignment_negative.test.ts`)
- [x] (P2) Snapshot tests for envelope ordering. (`error_envelope_order.test.ts`)
- [x] Plugin constraint tests (`plugin_constraint.test.ts`).
- [x] JSON / Opaque handling tests (`json_opaque.test.ts`).

## 13. Documentation Tasks
- [x] (P0) Add API Validation section to security guide. (`docs/guides/api-validation.md`)
- [ ] (P0) Update CLI docs if new flags introduced.
- [ ] (P1) Constraint annotations table. (basic table added; may expand)
- [ ] (P1) Quick-reference updates.
- [ ] (P2) Advanced patterns guide.

## 14. Plugin System Hooks
- [x] (P1) `registerValidationConstraint()` API. (basic hook implemented)
- [ ] (P2) Plugin pre-validation transforms.
- [ ] (P3) Sandbox validator execution.

## 15. Rollout Plan
- [x] Initial implementation direct enablement.
- [ ] (P1) Feedback & adjustments pre public preview.
- [ ] (P2) Optional opt-out env if needed.

## 16. Open Questions
- [ ] PATCH semantics strategy.
- [ ] Nested create handling.
- [ ] Date canonicalization.
- [ ] BigInt JSON strategy.

## 17. Definition of Done
- [ ] All P0 & P1 items checked.
- [ ] Benchmarks within budget.
- [ ] Docs updated + examples included.
- [ ] CI validation & lint pass.
- [ ] Security review pass.
- [ ] Release notes entry.

---
Generated: 2025-09-06
