# Locus Active Task Checklist (Cleaned)

Only open or newly identified tasks remain. Completed items moved to history (git log retains details). Phases retained for prioritization.

Legend: P1 Core | P2 Workflows | P3 UI | P4 Advanced | P5 Perf & GA

## 1. Syntax & Grammar Coherence
- [P3] Unify UI / state / action parsing under Chevrotain
  - [ ] Define UI lexical mode (avoid conflicts with existing tokens)
  - [ ] CST → UI AST builder w/ full location metadata (line/col + offsets)
  - [ ] Replace regex `parseStateDecls` with grammar rule
- [P4] Attribute annotation migration (paren → @)
  - [x] Emit structured deprecation (include usage counts) when legacy paren used
  - [x] Doc migration examples (before/after) in `docs/guides/annotations.md`
  - [ ] Final removal flag & cutover plan (tie to metric threshold)
- [P5] Generate `tokens.ts` from declarative spec
  - [ ] Author YAML/JSON token spec
  - [ ] Codegen script (order: longer → shorter patterns) + lint to assert sync
  - [ ] CI check: fail if drift

## 2. Naming & Consistency
- [P4] Canonical attribute form enforcement
  - [x] Auto-fix suggestion output snippet
  - [x] Formatter inserts canonical ordering of multiple attributes

## 3. Type System & Validation
- [x] (P2) Remove list optional semantics (defensive validator cleanup)
- [P4] Nullable vs optional semantic divergence
  - [x] Decide runtime semantics (nullable stored as NULL vs optional omitted)
  - [x] Prisma generator: map nullable to `?` + inline comment; optional only in input schema
  - [ ] Validation rule: cannot set default null on optional-only field

## 4. Performance & Scalability
- [P4] Memory profiling harness (full) & budgets
  - [x] Track per-phase memory deltas (parse, merge, validate, generate)
  - [x] Historical trend file (JSON lines) w/ rolling regression detection
- [P5] Workflow runtime JIT optimization
  - [ ] Compile step graph to JS function (hot path)
  - [ ] Benchmark vs interpreter (add perf test)
- [P4] Tighten parse memory/time budgets post-feature stabilization
  - [ ] Re-measure baseline
  - [ ] Lower threshold (<9.5MB, <180ms) if stable for 3 runs in CI

## 5. UI / Component Model
- [P3] UI AST precise spans for all nodes
  - [x] Include start/end offsets & original text slice
  - [x] Codeframe helper uses spans for error highlight
- [x] (P4) Inferred param confirmation lint
  - [x] Warn if inferred param later declared with conflicting type

## 6. Extensibility & Plugins
- [P4] Plugin security sandbox
  - [ ] Add optional isolated VM execution flag
  - [ ] Timeout + memory guard per hook
- [x] (P4) Plugin performance budget reporting
  - [x] Persist hook timings diff vs previous run

## 7. Tooling & CLI UX
- [x] (P3) Roadmap publication automation
  - [x] Generate markdown from checklist and push to docs
- [P4] Issue label sync script (phase labels)
  - [x] Implement sync script
- [P5] CLI update notification
  - [x] Version check against npm registry (opt-out env var)

## 8. Migration & Versioning
- [x] (P4) Removal schedule emission (enhanced)
  - [x] Include calendar date + version in each deprecation line
  - [x] Summarize counts by deprecation id at end of run
- [x] (P4) Legacy attribute removal test gate
  - [x] Fails build if any paren form persists once flag `REMOVE_PAREN_ATTRS=1`

## 9. Backwards Compatibility
- [P4] Automated legacy sample corpus test
  - [x] Parse archived v0.x examples to ensure compatibility until removal milestone

## 10. Testing Enhancements
- [x] (P3) Snapshot diff stabilizer
  - [x] Normalize non-deterministic fields (timestamps, ports) in generator outputs
- [x] (P4) Full build hash determinism
  - [x] Add final hash test after all generation steps including plugins

## 11. Documentation & Discoverability
- [x] (P3) Nullable vs optional documentation section
  - [x] Explain semantics & Prisma mapping
  - [x] Migration guidance from earlier single `?` behavior
- [P4] Annotations migration guide (expand stub)
  - [x] Table of legacy `(attr)` → `@attr` rewrites

## 12. Success Criteria & GA
- [P3] Mid-roadmap retrospection
  - [ ] Collect metrics (parse time, memory, warnings frequency)
- [P5] GA readiness review
  - [ ] Security checklist
  - [ ] Performance budgets locked
  - [ ] Deprecations resolved / removals executed
- [P5] Final production readiness sign-off checklist
  - [ ] Draft template
  - [ ] Fill with measured KPIs

## 13. Risk Mitigation
- [P1] Declarative token spec generator (see 1)
- [P3] Snapshot diff stabilizer (see 10)

## 14. Post-GA (Planned)
- [Future] Telemetry opt-in (perf/error anonymized)
- [Future] VS Code LSP (hover, completion, diagnostics)
- [Future] Plugin isolation hardening (WASM sandbox)

---
Add new tasks by editing this file; completed tasks should be removed to keep focus tight.
