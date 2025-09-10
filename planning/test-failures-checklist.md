# Test Failures Remediation Checklist

Goal: Track each failing test, root cause, and planned fix. Update status as fixes land.

Legend: [ ] pending | [~] in-progress | [x] fixed

## Global Root Cause Clusters
- Parser definition error: `CONSUME Colon appears more than once in relationDecl` – indicates grammar rule `relationDecl` uses `this.CONSUME(Colon)` multiple times without numeric suffixes; need to replace second and subsequent occurrences with `this.CONSUME1(Colon)`, `this.CONSUME2(Colon)`, etc., or refactor rule into subrules. This blocks majority of parsing tests.
- Token spec sync mismatch – tokens.ts diverged from generator spec; update snapshot or align generation script to new tokens (decide: adjust generation source to include new tokens and removed duplicates, then update test expectation).
- CLI JSON error format test expecting `code: parse_error` but now diagnostic returns `code: PARSE_ERROR` or different shape; adjust reporter or test to new structured diagnostic format.
- Express generator snapshot now includes validation scaffolding; snapshot must be updated or behavior reverted (decide to accept new validation output and update snapshot).
- Error suggestion tests expect mistyped token present or suggestion list; our messages changed; either restore old phrasing or adapt tests to new approach.

## Checklist by Test Suite

### Parser / Workflow / Features (mass failures)
- [ ] workflow_basic.test.ts – Blocked by relationDecl duplicate Colon consumption.
- [ ] workflow_steps.test.ts – Same parser definition error.
- [ ] workflow_retry_block.test.ts – Same parser definition error.
- [ ] workflow_parse_perf.test.ts – Same parser definition error.
- [ ] workflow_manifest_structured.test.ts – Same parser definition error.
- [ ] executor.test.ts – Same parser definition error, plus runtime depending on parsed steps.
- [ ] runtime_log_version.test.ts – Same parser definition error.
- [ ] runtime_retry.test.ts – Same parser definition error.

### Features / Components / UI
- [ ] features_full.test.ts – Parser definition error.
- [ ] features_cst.test.ts – Parser definition error.
- [ ] component_inferred_params.test.ts – Parser definition error.
- [ ] ui_ast.test.ts – Parser definition error.

### Entity / Upload / Primitives / State / Nullable
- [ ] entity_fuzz.test.ts – Parser definition error; once fixed re-run fuzz for hidden issues.
- [ ] new_primitives.test.ts – Parser definition error; verify new tokens integrated in grammar.
- [ ] nullable_union_syntax.test.ts – Parser definition error; ensure grammar path for `| Null` unaffected by relationDecl fix.
- [ ] state_decl_structured.test.ts – Parser definition error; stateDecl rule unaffected but blocked upstream.
- [ ] upload_dsl.test.ts – Parser definition error; inspect upload rules after main fix.

### Validator
- [ ] duplicate_field.test.ts – Parser definition error; after fix validate location spans still correct.
- [ ] design_system_names_loc.test.ts – Parser definition error; confirm design system builder unaffected.

### Security
- [ ] email_sanitization.test.ts – Parser definition error currently masking send_email validation; after parser fix re-evaluate sanitization logic.

### Incremental / Generator / Prisma
- [ ] output_hash_determinism.test.ts – Parser definition error blocks build; after fix re-check deterministic outputs (may change due to added ids in steps; ensure id ordering does not impact unrelated outputs).
- [ ] prisma_list_primitives.test.ts – Parser definition error; then confirm nullable vs optional mapping.

### CLI
- [ ] check_command.test.ts – Exit status 1; caused by parser failure; retest after grammar fix.
- [ ] error_format_json.test.ts – Failing assertion on diagnostic code; adjust reporter or test expectation.

### Generator Snapshots
- [ ] snapshots.test.ts – Snapshot mismatch due to added validation imports & logic; decide to keep new code and update snapshot.
- [ ] plugin performance snapshot (obsolete) – One obsolete snapshot; review plugin output changes & update snapshot.

### Error Suggestions
- [ ] error_suggestions.test.ts – Expectations not matching new suggestion logic (messages lack expected strings). Need to ensure parse error includes offending token image; maybe adjust error transformation or test to search suggestions array if exposed.

## Planned Fix Order
1. Fix `relationDecl` duplicate Colon consumption in `databaseParser.ts` (root cause for majority). Add unit test to ensure no Chevrotain definition errors.
2. Re-run tests; next address token spec sync test by regenerating spec fixture or updating generator script.
3. Adjust reporter JSON code field to remain backward-compatible (include `code: 'parse_error'`).
4. Update snapshots for express routes & plugin outputs (after confirming diff intentional).
5. Revisit error suggestion test expectations; include mistyped token in thrown PError message.
6. Re-run full suite; tackle any remaining individual test failures (security sanitization, nullable union semantics, incremental hash stability).

## Additional Notes
- After parser fix, create a guard test that scans grammar for repeated raw `this.CONSUME(Token)` duplicates within same rule and enforces numbering to prevent regression.
- Consider splitting `relationDecl` into smaller subrules for readability & to avoid numbering conflicts.

(Will append detailed per-test root cause notes as fixes proceed.)
