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
- [x] Binding namespace reservation (implemented regex scan; improvement for semantic scope deferred).

### Phase 4: Step Grammar (DONE)
- [x] Structured parsing for step statements (run, http_request, delay, branch, forEach) with binding prefix.
- [x] CST rules added; builder captures steps as raw slices (full structured AST deferred).
- [x] Basic positive test (`workflow_steps.test.ts`).
- [x] Negative tests (malformed/nested) added (`workflow_negative_steps.test.ts`).

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
- [x] Retry (raw + structured retryConfig). Input/state schema still deferred.
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
 - [x] Queue instead of drop (simple FIFO) for concurrency groups.
 - [ ] Future: simulated clock / async delay handling.

### Phase 10: Plugin Extension Points (PARTIAL)
- [x] Add hooks: `onWorkflowParse`, `onWorkflowValidate`, `registerWorkflowStepKinds`.
- [x] Collect custom step kinds in plugin manager.
- [x] Runtime supports executing custom step kinds (injected `pluginManager` into `executeWorkflow`).
- [x] CLI/runtime integration (plugin manager already created in build & dev; added `workflow:run` command for execution with automatic plugin injection).
- [x] Tests: registering & executing custom step kind (runtime execution log).

### Phase 11: send_email + on_failure (PARTIAL)
- [x] Parse & AST for `send_email` step (grammar + modularAstBuilder extraction).
- [x] Validation of required fields (`to` plus `subject` or `template`).
- [x] Include in manifest (kind surfaced per-step, send_email fields kept only in raw for now).
- [x] Support `on_failure` block (executed when error and no `on_error`).
- [x] Tests: parsing & manifest snapshot for send_email (runtime-focused parse/validate test added).
- [x] Tests: validation errors (missing to / both subject+template absent).
- [x] Tests: runtime on_failure path triggers when no on_error.
- [x] Structured field serialization (to/subject/template) in manifest v2.

### Phase 12: Webhook Trigger (PARTIAL)
- [x] Basic detection of `on:webhook` in trigger raw with secret extraction (`secret:NAME`).
- [x] Validation preventing combination with entity triggers (already in validator).
- [x] Manifest includes `triggerMeta` with `{ type: 'webhook', secretRef }`.
- [x] Generate route definition stub (express/manifest artifact) with secret key.
- [x] Tests: triggerMeta extraction (covered in send_email test).
- [x] Test: invalid combo scenario (webhook + entity event) validation error.

### Phase 13: Documentation & Examples (PARTIAL)
- [x] Added `docs/language/workflows.md` covering implemented subset.
- [x] Snippet test validating code blocks parse.
- [x] Added branch & forEach examples (parser-friendly) to docs with snippet test.

### Phase 14: Hardening & Polish
- [ ] Improve error messages with precise spans for all constructs (partial: send_email now step-located).
- [x] Deterministic ordering for manifest keys incl. sorted retryConfig.
- [x] Performance baseline test for parsing N workflows (`workflow_parse_perf.test.ts`).
- [x] Performance warnings for slow plugin workflow hooks (>50ms) with test.

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
- Phase 9: Introduced retryBlock grammar + AST capture + parsing test. Added queue concurrency + structured manifest v2.
- Phase 6: Added retry validation & tests. send_email step loc + error precision improvements. Docs + snippet tests added.
