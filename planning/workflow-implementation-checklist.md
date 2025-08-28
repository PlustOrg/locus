## Workflow Feature Implementation Checklist

This checklist operationalizes the unified `workflow` blueprint. Each phase should end in green tests and zero lint errors. Keep commits small & deterministic.

### Phase 1: Lexer & Grammar Scaffold (DONE)
- [x] Add tokens: `workflow`, `trigger`, `input`, `steps`, `on_error`, `concurrency`, `retry`, `on_failure`, `group`, `limit`, `policy`, `delay`, `branch`, `forEach`, `send_email`, `http_request`.
- [x] Insert tokens before `Identifier` in `AllTokens` (preserve ordering invariant; Unknown last).
- [x] Extend grammar with `workflowBlock` at top level.
- [x] Sub-block parsers: `triggerBlock`, `inputBlock`, reuse existing `stateBlock`, add `stepsWorkflowBlock`, `onErrorWorkflowBlock`, `concurrencyBlock` (raw content for now).
- [x] Allow new block keywords inside `rawContent` via token additions.
- [x] Basic parser test: parses minimal workflow with trigger + steps.

### Phase 2: AST Layer (DONE)
- [x] Introduce AST node shapes for Workflow + sub-blocks.
- [x] Extend builder (modular) to build workflow nodes (raw sections captured).
- [x] Integrate into merger (collect workflows array + duplicate detection).
- [x] Basic test via existing workflow_basic + presence checks.

### Phase 3: Validation (Foundational) (DONE)
- [x] Validator: ensure required blocks (`trigger`, `steps`).
- [x] Disallow incompatible trigger combinations (`webhook` + entity events) (text scan placeholder).
- [x] Detect duplicate workflow names (merger).
- [ ] Binding namespace reservation (deferred to step grammar phase) — will finalize in Phase 6.

### Phase 4: Step Grammar (DONE)
- [x] Structured parsing for step statements (run, http_request, delay, branch, forEach) with binding prefix.
- [x] CST rules added; builder captures steps as raw slices (full structured AST deferred).
- [x] Basic positive test (`workflow_steps.test.ts`).
- [ ] Negative tests (malformed/nested) deferred to later hardening.

### Phase 5: Expression Mini-Parser (UPDATED)
- [x] Pratt parser for identifiers, literals, member access, unary !/-, binary == != && || + - * / with precedence.
- [x] Tests: precedence, logical chaining, member + parens.
- [x] Single-arg run() step argument expression capture (member/id) via CST offsets.
- [x] Multi-arg run() parsing (args array + per-arg capture).
- [x] Branch condition expression capture + parse.
- [x] forEach iterable expression capture.

### Phase 6: Validator (UPDATED)
- [x] Name resolution duplicate detection (regex-based) forbidding shadowing.
- [x] Basic run step arg expr parse presence (no semantic resolution yet).
- [x] Action presence validation (placeholder ensures action token exists).
- [x] forEach iterable expression presence validation.
- [x] Retry strategy validation (max/backoff/factor/delay basic constraints).

### Phase 7: Code Generation Manifest (DONE MVP + ENRICHED)
- [x] Deterministic JSON per workflow (`workflows/<name>.json`).
- [x] Included fields: name, trigger (raw), steps (raw list), concurrency, onError, version.
- [x] Run step enriched with args array + single-arg expr when applicable.
- [x] Branch step metadata (condition, branch counts), for_each metadata (loopVar, iterRaw).
- [ ] Retry, input schema, state schema deferred.
- [x] Test added (`workflow_manifest.test.ts`).

### Phase 8: Runtime Stub (IN PROGRESS)
- [x] Lightweight in-process executor (sequential) with context & binding table.
- [x] Implemented: run (records invocation), delay (simulated), branch (condition eval), for_each (iter array binding).
- [x] Basic execution test (order & counts).
- [x] Data propagation tests (binding resolution inside branch & for_each).
- [x] Error surfacing & onError path stub (raw on_error tokens executed as actions).
	- NOTE: Need future negative path & member access tests.

### Phase 9: Retry & Concurrency Simulation (IN PROGRESS)
 - Grammar & AST capture + validation done.
 - Manifest includes retry raw + structured retryConfig.
 - [x] Runtime retry loop (fixed + exponential placeholder) with log entries.
 - [x] Concurrency groups scaffold (drop when active >= limit) + test.
 - [x] Tests: retry success, retry exhaustion, concurrency drop.
 - [ ] Future: proper simulated clock + queued execution instead of drop.

### Phase 10: Plugin Extension Points (PARTIAL)
- [x] Add hooks: `onWorkflowParse`, `onWorkflowValidate`, `registerWorkflowStepKinds`.
- [x] Collect custom step kinds in plugin manager.
- [x] Runtime supports executing custom step kinds (injected `pluginManager` into `executeWorkflow`).
- [ ] CLI/runtime integration wiring (passing plugin manager automatically) (optional for MVP).
- [ ] Tests: registering & executing custom step kind (manifest + execution log).

### Phase 11: send_email + on_failure (PARTIAL)
- [x] Parse & AST for `send_email` step (grammar + modularAstBuilder extraction).
- [x] Validation of required fields (`to` plus `subject` or `template`).
- [x] Include in manifest (kind surfaced per-step, send_email fields kept only in raw for now).
- [x] Support `on_failure` block (executed when error and no `on_error`).
- [x] Tests: parsing & manifest snapshot for send_email (runtime-focused parse/validate test added).
- [x] Tests: validation errors (missing to / both subject+template absent).
- [x] Tests: runtime on_failure path triggers when no on_error.
- [ ] Future: structured field serialization (to/subject/template) in manifest.

### Phase 12: Webhook Trigger (PARTIAL)
- [x] Basic detection of `on:webhook` in trigger raw with secret extraction (`secret:NAME`).
- [x] Validation preventing combination with entity triggers (already in validator).
- [x] Manifest includes `triggerMeta` with `{ type: 'webhook', secretRef }`.
- [ ] Generate route definition stub (express/manifest artifact) with secret key.
- [x] Tests: triggerMeta extraction (covered in send_email test).
- [ ] Test: invalid combo scenario (webhook + entity event) expected validation error.

### Phase 13: Documentation & Examples
- [ ] Add docs section referencing implemented subset (mark future features clearly).
- [ ] Inline code samples validated by docs tool.

### Phase 14: Hardening & Polish
- [ ] Improve error messages with precise spans for all new constructs.
- [ ] Enforce deterministic ordering for manifest object keys (ensure new retryConfig keys sorted; verify custom steps serialization).
- [ ] Performance baseline test for parsing N workflows.
- [ ] Performance warnings for slow plugin workflow hooks.

### Phase 15: Future (Not in MVP)
- [ ] State mutation (`update_state`).
- [ ] Cancel policy runtime + `on_cancel` hook.
- [ ] Jitter/backoff customization.
- [ ] Expression type inference / richer static analysis.

---
Progress Log (append entries):
- Phase 1: Completed (tokens + grammar + basic AST placeholder + tests green)
- Phase 2: Completed (typed workflow AST + merger integration)
- Phase 3: Completed (basic validation; binding reservation deferred)
- Phase 4: Completed (step grammar + tests)
- Phase 5: Deferred
- Phase 6: Partial (binding shadowing implemented)
- Phase 7: Completed (workflow manifests JSON + tests; retry/input/state deferred)
- Phase 5: Partial (expression parser core implemented, not yet integrated)
- Phase 8: Added branch condition heuristics, executor covers branch/for_each; test updated.
- Phase 9: Introduced retryBlock grammar + AST capture + parsing test.
- Phase 6: Added retry validation & tests.
