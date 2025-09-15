# Development Plan

This is a documentation stub referencing the project planning materials.

For the authoritative, up-to-date roadmap see the files under `planning/` in the repository root.

- Core phases: parsing, validation, generation.
- Near-term focus: test completeness, docs parity, performance baselining.

(Stub added to satisfy docs link integrity.)

## Parser Refactor (2025-09)
The parser directory was reorganized with pure helpers:
- `primitiveTypes.ts` centralizes primitive token handling.
- `stateHelpers.ts` deduplicates page/store state parsing.
- `workflowBuilder.ts` and `uploadBuilder.ts` isolate feature-specific CST→AST logic.

Guard tests were added:
- `grammar_rule_names.test.ts` hashes sorted rule & token names to detect unintended grammar drift.
- `primitives_hash.test.ts` hashes a canonical entity's field primitive mapping to ensure stability.

When intentionally changing grammar or primitives:
1. Make the change.
2. Run the tests to confirm the failing baseline.
3. Update the expected hash in the corresponding test with a commit message describing the rationale.

All helpers are pure; any future caching must be env-flagged to keep deterministic test runs.
