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

### Phase 4: Step Grammar (Structural Parsing)
- [ ] Replace raw `steps` content with structured parsing for step statements (run, http_request, delay, branch, forEach).
- [ ] Add CST rules + AST transformation.
- [ ] Negative tests (unknown step kind, malformed branch, nested branch restricted).

### Phase 5: Expression Mini-Parser (Optional Early Slice)
- [ ] Implement minimal expression parsing (ident, literals, property access, ==, &&, ||, parentheses).
- [ ] Map to AST nodes with location spans.
- [ ] Update branch condition parsing + trigger `where`.

### Phase 6: Validator (Data Flow & Semantics)
- [ ] Name resolution for const bindings, forbidding shadowing.
- [ ] Validate referenced actions exist (reuse action registry or page/store scanning output).
- [ ] Validate forEach iterable expression type (best-effort heuristic initially).
- [ ] Retry strategy registry with validation.

### Phase 7: Code Generation Manifest
- [ ] Produce deterministic JSON manifest per workflow (in build output folder, e.g. `workflows/<name>.json`).
- [ ] Include: name, triggers[], steps[], retry?, concurrency?, input schema (normalized), state schema.
- [ ] Snapshot tests for manifest.

### Phase 8: Runtime Stub
- [ ] Add lightweight in-process executor for tests (sequential, no queue yet).
- [ ] Execute run + delay (no real waiting; mock), branch, forEach semantics.
- [ ] Tests verifying execution order & data propagation.

### Phase 9: Retry & Concurrency Simulation
- [ ] Implement retry loop with exponential/fixed strategies (time simulated).
- [ ] Concurrency group locking (in-memory map) with queue & drop policies (cancel deferred).
- [ ] Tests for edge cases.

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
