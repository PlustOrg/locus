# Performance & Budgets

This guide documents the current locked performance budgets, how we measure them, and how experimental JIT execution paths affect results.

## Budgets (Locked)
| Phase Metric | Budget | Notes |
|--------------|--------|-------|
| Parse time (medium project) | < 180 ms | Median of 5 runs (cold) on CI reference machine. |
| Parse memory delta | < 13 MB | Resident set increase after full parse. |
| Workflow parse (50 workflows) | < 400 ms | Synthetic workload. |
| Entity 200 memory delta | < 15 MB | Stress entity modeling. |

Breaching a budget triggers a failing perf test; tighten thresholds only after sampling stability.

## Measurement Methodology
Bench harness in `scripts/` runs targeted scenarios; results stored in `scripts/perf-baseline.json`. CI compares new run vs baseline with a small tolerance window (±5%). Spikes beyond tolerance surface a regression warning or test failure (depending on severity).

## Determinism Requirement
All generators sort lists & keys; avoid adding nondeterministic values (timestamps, random IDs) to emitted files. If nondeterminism is required, isolate behind a flag and redact in snapshots.

Snapshot Tests: Snapshot-based tests rely on deterministic ordering. If you add a new collection to the AST, ensure downstream generators sort it (e.g. by `name`) before emission.

## Workflow JIT (`LOCUS_WORKFLOW_JIT`)
When enabled, the workflow engine compiles the step graph to a JS function. Benefits:
* Fewer object allocations on hot path.
* Reduced per-step dispatch overhead.

Trade-offs:
* Initial compile adds small upfront cost.
* Experimental: interface *may* change; monitor release notes.

Recommended: Use JIT only after confirming a bottleneck with profiling; otherwise keep default interpreter for simpler debugging.

## Debugging Performance Regressions
1. Run with `LOCUS_DEBUG=1 locus build` to view per-phase timings.
2. Compare with previous successful run (CI artifacts or local logs).
3. Use node `--inspect` with the bench scripts for CPU profiling if needed.

## Future Work
| Candidate | Status |
|----------|--------|
| Parallel file parse workers | Prototype (disabled by default) |
| Incremental AST diff memory accounting | Planned |
| Workflow JIT bytecode caching | Planned |

---
_Last updated: 2025-09-04_