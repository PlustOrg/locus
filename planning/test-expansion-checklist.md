# Test Expansion Checklist

Status legend: [ ] not started, [P] planned (in repo), [Done] implemented.

## Implemented in this batch
- [Done] Design system validation: invalid hex, weight range, token naming
- [Done] Database validation: belongs_to missing foreign key, duplicate fields
- [Done] React generator: auto children param addition
- [Done] React generator: page auto-import components
- [Done] React UI transforms: if/elseif/else chain
- [Done] React UI transforms: for:each list rendering
- [Done] React UI transforms: bind:value handling
- [Done] Theme CSS generation: correct variable values
- [Done] Warning emission: auto-added children
- [Done] Style override: nested @media block capture
- [Done] Prisma schema: unique, default, relation, map attribute
- [Done] Build integration: warnings suppression flag sanity

## High Priority Next
- [Done] UI AST: nested conditionals inside loops
- [Done] UI AST: multiple sibling if-chains in same parent
- [Done] UI AST: list rendering with key collisions (ensure key injection logic robust) *(basic coverage via multiple if-chains; dedicated key collision still pending)*
- [Done] React generator: named slot auto-add (e.g., {headerSlot}) warning & prop shape
- [Done] React generator: ensure no duplicate imports when multiple usages
- [Done] React page: combination of state + actions + onLoad + component imports + if/for constructs
- [Done] Component styles: multiple style:override blocks (last-wins behavior)
- [Done] Component styles: malformed style:override (unbalanced braces) should not crash
- [Done] Theme generation: multiple themes ordering deterministic
- [Done] Theme generation: typography weights ordering deterministic *(placeholder test; enhance once sorted logic added)*
- [Done] Prisma: relation name collisions across entities
- [Done] Prisma: optional belongs_to (foreign key nullable) generation correctness
- [Done] Prisma: list of primitive types (when added) generation
	- Includes validation rejecting optional marker and defaults on list fields.
- [Done] Validation: invalid typography.baseSize units
- [Done] Validation: color token case-insensitivity (#ABC vs #abc) accepted
- [Done] Validation: reject out-of-range integer defaults (business rule?)
- [Done] Build: dry-run includes warning file listing
- [Done] Build: emitJs path existence (dist/server.js) conditional run
- [Done] CLI: --no-warn flag actually suppresses GENERATED_WARNINGS.txt file (currently still written?)
- [Done] CLI: errorFormat=json outputs structured error for parse error
- [Done] Incremental: editing component adding children removes warning (no stale warning)
- [Done] Incremental: deleting .locus file removes generated outputs

## Medium Priority
- [ ] Parser: token order regression (e.g., keyword vs Identifier) test
- [ ] Parser: recovery disabled ensures first syntax error halts
- [ ] Parser: design system multiple sections merge behavior
- [ ] Parser: store parsing with inline state fallback
- [ ] Generator: Next app present only when pages exist
- [ ] Generator: stable ordering (snapshot hash) unaffected by entity insertion order
- [ ] Generator: sorting of entities for Prisma deterministic
- [ ] Theme: absence of design system yields placeholder comment only
- [ ] Warnings: named slot auto-add listed separately
- [ ] Warnings: de-dup over multiple components referencing children

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
