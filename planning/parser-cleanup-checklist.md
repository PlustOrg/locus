# Parser Parser Modernization – Next Steps

Objective: Remove dead/unused code and prepare for a clean renaming of legacy artifacts (e.g. `databaseParser.ts` / `DatabaseCstParser`) to clearer, future‑proof names (`locusParser.ts` / `LocusCstParser`) without breaking existing tests or hash guards until the final, intentional update.
Scope: Only structural cleanup & rename scaffolding. No semantic / grammar behavior changes (AST, errors, hashes) until the deliberate hash baseline update step.

## Core Rules
- No rule or token name changes until the explicit “Rename & Re‑baseline” phase.
- All removals require: (1) grep shows no references; (2) tests green after removal.
- Keep hash guard tests (`grammar_rule_names.test.ts`, `primitives_hash.test.ts`) passing until the re‑baseline step.

## Phase B: Safe Removals & Visibility Tightening
- [x] Remove `primitiveTokenToName` from `primitiveTypes.ts` (unused).
- [x] Make `parseStructuredStateDecls` non-exported (internal helper only).
- [x] Decide fate of `astUtils.ts` (blanked; pending deletion if still unused after rename cycle).
- [x] (Retained) instrumentation exports `__getAstAllocCount` / `__getEntityBuildCount` kept for tests with retention comment.
- [x] Run full test suite after removals (all green).

## Phase C: Primitive Mapping Consolidation (Optional)
- [x] Replace `mapPrimitiveToken` switch with table derived from `PRIMITIVE_TOKEN_NAMES` (no behavior change).
- [x] Add unit test: every primitive token maps to expected name.

## Phase D: Parser Rename Preparation (Non-breaking)
- [ ] (Skipped) Create `locusParser.ts` shim (class directly renamed instead).
- [x] Migrate internal imports (exclude tests) to new `LocusCstParser` symbol.
- [x] Add legacy banner comment in `databaseParser.ts` noting previous name.
- [x] Verify hash test unchanged after rename (if not already run).

## Phase E: Intentional Rename & Baseline Update
- [x] Rename class to `LocusCstParser` completed.
- [x] Update all imports & tests (VS Code auto-updated; confirmed via grep).
- [x] Run hash test (no change; rule names unaffected) – baseline update skipped.
- [ ] (Optional) Remove legacy banner later (kept now for clarity).

## Phase F: Post-Rename Cleanup
- [x] Grep & remove lingering `databaseParser` references (only legacy notice + benchmark script updated).
- [x] Update docs (`development-plan.md`, quest docs) to reflect new naming.
- [x] Run final full test & benchmark (baseline tokens/sec ~4k; current 50 iters => ~4033 t/s within band).

## Phase G: Optional Follow-ups
- [ ] Write parser API surface doc.
- [ ] Explore modular grammar split (workflow/upload) – new baseline required (deferred).

## Risk Mitigation Checklist
- After each removal (Phase B) run: targeted test + full test.
- Keep commits small: one logical removal/refactor per commit for easy rollback.
- Capture timing before and after the rename (micro benchmark script) for regression awareness.

## Tracking Template (Duplicate of Phases for quick view)
- [x] B1 remove primitiveTokenToName
- [x] B2 internalize parseStructuredStateDecls
- [x] B3 delete astUtils.ts (blanked)
- [x] B4 instrumentation exports decision (retain for tests)
- [x] B5 full test run
- [x] C6 table-driven mapPrimitiveToken
- [x] C7 primitive mapping unit test
- [ ] D8 (skipped) add locusParser.ts shim
- [x] D9 migrate internal imports
- [x] D10 legacy banner comment
- [x] D11 hash check
- [x] E12 rename class
- [x] E13 update imports/tests
- [x] E14 hash failure observed (none)
- [x] E15 update baseline hash (not needed)
- [ ] E16 remove legacy file (not applicable; keeping same path)
- [x] F17 grep lingering names
- [x] F18 docs update
- [x] F19 perf benchmark
- [ ] G20 parser API docs (optional)
- [ ] G21 modular grammar exploration note (optional)

Maintain zero semantic change until E15.
