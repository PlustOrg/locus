# Test Expansion Checklist

Status legend: [ ] not started, [P] planned (in repo), [Done] implemented.

## Low Priority / Stretch
- [ ] Performance: benchmark parser speed regression guard (perf_baseline.json)
- [ ] Large project: 100 entities generation within time threshold
- [ ] Memory footprint snapshot (heap) after big build
- [ ] Stress: extremely long UI template (line/column accuracy)
- [ ] Stress: deep nested if/else chains transformation correctness
- [ ] Stress: large number of design tokens (sorting stability)
- [ ] Tooling: ensure package.json script set differs when no pages
- [ ] Security: ensure no prototype pollution via design system keys
- [ ] CLI: invalid subcommand help output consistency

## Nice to Have Utilities
- [ ] Helper to generate unified AST fixtures programmatically
- [ ] Custom matcher for prisma schema fields
- [ ] Snapshot serializer trimming volatile whitespace

## Notes
Prioritize High Priority Next items for immediate robustness. Add new items as features evolve.
Hex color enhancement: unquoted #rgb/#rrggbb tokens now supported in design system token assignments.
Structured warnings & manifest: Added GENERATED_WARNINGS.json with categorized kinds and BUILD_MANIFEST.json with deterministic sha256 hash.
