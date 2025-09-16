# Parser Parser Modernization – Next Steps

Objective: Remove dead/unused code and prepare for a clean renaming of legacy artifacts (e.g. `databaseParser.ts` / `DatabaseCstParser`) to clearer, future‑proof names (`locusParser.ts` / `LocusCstParser`) without breaking existing tests or hash guards until the final, intentional update.
Scope: Only structural cleanup & rename scaffolding. No semantic / grammar behavior changes (AST, errors, hashes) until the deliberate hash baseline update step.

## Core Rules
- No rule or token name changes until the explicit “Rename & Re‑baseline” phase.
- All removals require: (1) grep shows no references; (2) tests green after removal.
- Keep hash guard tests (`grammar_rule_names.test.ts`, `primitives_hash.test.ts`) passing until the re‑baseline step.

## Phase B: Safe Removals & Visibility Tightening
- [ ] Remove `primitiveTokenToName` from `primitiveTypes.ts` (unused).
- [ ] Make `parseStructuredStateDecls` non-exported (internal helper only).
- [ ] Decide fate of `astUtils.ts` (delete now; re-create later if needed).
- [ ] Remove instrumentation exports `__getAstAllocCount` / `__getEntityBuildCount` if unused OR add retention comment.
- [ ] Run full test suite after removals.

## Phase C: Primitive Mapping Consolidation (Optional)
- [ ] Replace `mapPrimitiveToken` switch with table derived from `PRIMITIVE_TOKEN_NAMES` (no behavior change).
- [ ] Add unit test: every primitive token maps to expected name.

## Phase D: Parser Rename Preparation (Non-breaking)
- [ ] Create `src/parser/locusParser.ts` shim exporting `{ LocusCstParser = DatabaseCstParser }`.
- [ ] Migrate internal imports (exclude tests) to `locusParser`.
- [ ] Add legacy banner comment inside `databaseParser.ts` pointing to new file.
- [ ] Verify hash test unchanged.

## Phase E: Intentional Rename & Baseline Update
- [x] Rename class to `LocusCstParser` (or move grammar code).
- [ ] Update all imports & tests.
- [ ] Run hash test (expect failure) and update baseline with explanatory commit.
- [ ] Remove legacy `databaseParser.ts` (or leave stub if desired).

## Phase F: Post-Rename Cleanup
- [ ] Grep & remove lingering `databaseParser` references.
- [ ] Update docs (`development-plan.md`, README) to reflect new naming.
- [ ] Run final full test & benchmark (±5% perf band).

## Phase G: Optional Follow-ups
- [ ] Write parser API surface doc.
- [ ] Explore modular grammar split (workflow/upload) – new baseline required (deferred).

## Risk Mitigation Checklist
- After each removal (Phase B) run: targeted test + full test.
- Keep commits small: one logical removal/refactor per commit for easy rollback.
- Capture timing before and after the rename (micro benchmark script) for regression awareness.

## Tracking Template (Duplicate of Phases for quick view)
- [ ] B1 remove primitiveTokenToName
- [ ] B2 internalize parseStructuredStateDecls
- [ ] B3 delete astUtils.ts
- [ ] B4 instrumentation exports decision
- [ ] B5 full test run
- [ ] C6 table-driven mapPrimitiveToken
- [ ] C7 primitive mapping unit test
- [ ] D8 add locusParser.ts shim
- [ ] D9 migrate internal imports
- [ ] D10 legacy banner comment
- [ ] D11 hash check
- [ ] E12 rename class
- [ ] E13 update imports/tests
- [ ] E14 hash failure observed
- [ ] E15 update baseline hash
- [ ] E16 remove legacy file
- [ ] F17 grep lingering names
- [ ] F18 docs update
- [ ] F19 perf benchmark
- [ ] G20 parser API docs (optional)
- [ ] G21 modular grammar exploration note (optional)

Maintain zero semantic change until E15.
