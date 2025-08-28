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
- [ ] Retry strategy validation (retry syntax parsed; semantic rules pending).

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
- [ ] Data propagation tests (binding resolution deeper, member access).
- [ ] Error surfacing & onError path stub.
	- NOTE: Branch condition evaluation & for_each execution validated; need negative path tests.

### Phase 9: Retry & Concurrency Simulation (NOT STARTED)
 - Grammar & AST capture for retry block added (raw). Transitioning to PARTIAL.
 - [ ] Retry loop (fixed + exp backoff) using simulated clock.
 - [ ] Concurrency groups: simple in-memory lock table with queue length & drop policy.
 - [ ] Tests: lock contention, retry exhaustion, backoff ordering.

### Phase 10: Plugin Extension Points
- [ ] Add hooks: `onWorkflowParse`, `onWorkflowValidate`, `registerWorkflowStep`.
- [ ] Test registering custom step kind.

### Phase 11: send_email + on_failure
- [ ] Parse & AST for `send_email` step.
- [ ] Validation of required fields (to, subject OR template minimal, etc.).
- [ ] Include in manifest.
- [ ] Support on_failure mini step list (subset of step kinds).

### Phase 12: Webhook Trigger
- [ ] Add webhook trigger AST shape.
- [ ] Generate route definition stub (manifest entry) with secret key.
- [ ] Validation for unsupported combos.

### Phase 13: Documentation & Examples
- [ ] Add docs section referencing implemented subset (mark future features clearly).
- [ ] Inline code samples validated by docs tool.

### Phase 14: Hardening & Polish
- [ ] Improve error messages with precise spans for all new constructs.
- [ ] Enforce deterministic ordering for manifest object keys.
- [ ] Performance baseline test for parsing N workflows.

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
