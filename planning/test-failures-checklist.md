# Test Failures Remediation Plan (Current Baseline)

Legend: [ ] pending | [~] in-progress | [x] fixed

Snapshot (after full run): 20 failing suites (workflow & new grammar focus + validation messaging + route generation).

## High-Impact Root Causes
1. Workflow grammar regression (`triggerDecl` simplified incorrectly): All workflow-* parser, validator, generator tests failing with `Expecting token of type --> Identifier <-- but found --> '(' <--` when parsing `on create(Entity)` patterns. Need to restore original trigger grammar that supported: `on create(Foo)`, `on update(Foo)`, `on delete(Foo)`, and webhook form `on webhook(...)` (with optional colon).
2. Relation `on_delete` attribute not captured: `p0_new_grammar.test.ts` expects `on_delete: cascade` but relation builder returns object without property.
3. Optional list handling divergence: Parser now permits `list of T?` silently; validator error message changed to a deprecation phrasing not matching tests (tests expect `/Optional list type not allowed/`). Standardize message.
4. API validation integration test: Missing generated `routes/user.ts` implies express API generator not invoked or entity collection empty in build pipeline.
5. New grammar test referencing `databaseBlock` directly; CST shape may have changed (top-level wrapper). Need test or builder adjustment after grammar restoration.

## Target State
All existing tests green with: restored workflow trigger grammar, consistent validation error messaging, relation on_delete captured, route generation producing validation import functions.

## Remediation Steps (Ordered)
1. [ ] Restore `triggerDecl` in `databaseParser.ts`:
	- Reintroduce two ALTs: webhook + entity event.
	- Maintain numeric suffixes for repeated `OPTION/OR/CONSUME` calls.
	- Allow (optional colon) after `on`.
	- Pattern: `on [':' ] webhook ( '(' [secret: NAME] ')' )?` OR `on [':' ] (create|update|delete) '(' Identifier ')'`.
	- Add minimal unit parser test for each variant.
2. [ ] Reinstate original fieldType (no special optional list error there). Remove `_sawOptionalList` side effect.
3. [ ] Validator message normalization: When detecting optional list (`list of T?` or mutated AST with `optional && kind==='list'`), throw `Optional list type not allowed` to satisfy both parser and validator tests.
4. [ ] Capture `on_delete` in `relationDecl` and propagate in AST builder (confirm builder file; add property `onDelete`). Update relation tests accordingly if naming differs; prefer camelCase `onDelete`.
5. [ ] Ensure express generator invoked in build path for CLI integration: verify build pipeline collects entities after parse/merge; if workflow grammar short-circuit prevented entity collection, step 1 fixes; else inspect `src/generator/pipeline.ts` for route generation gating condition.
6. [ ] Adjust `p0_new_grammar.test.ts` ONLY if CST shape remains different after grammar restoration; aim to keep previous test intact by restoring earlier CST layout (expose `databaseBlock` at root-level children array).
7. [ ] Standardize optional+nullable conflict validator message to include phrase `cannot be both optional and nullable` exactly once.
8. [ ] Re-run focused suites: (a) grammar tests, (b) workflow_* tests, (c) api_validation_integration, (d) nullable_optional_conflict.
9. [ ] Run full test suite; capture any remaining edge failures (e.g., retried backoff tokens, docs workflow snippets) and patch incremental issues.
10. [ ] Add guard regression test: Iterate parser source for duplicate un-suffixed `this.CONSUME(` of same token type inside a single rule body (optional improvement).

## Work Breakdown & Ownership
All steps handled in this remediation branch (no external deps). No schema or token changes required.

## Validation/Error Message Canonical Forms
- Optional list: `Optional list type not allowed`.
- Optional+nullable: `Field '<name>' on entity '<Entity>' cannot be both optional and nullable.` (Keep existing but ensure test regex matches substring.)
- On delete: relation object should expose `onDelete` with value in { cascade, restrict, set_null }.

## Fast Feedback Test Sets
Phase A: `tests/parser/workflow_basic.test.ts`, `tests/parser/workflow_steps.test.ts`.
Phase B: `tests/validator/workflow_retry_validation.test.ts`, `tests/generator/workflow_manifest.test.ts`.
Phase C: `tests/cli/api_validation_integration.test.ts`, `tests/parser/p0_new_grammar.test.ts`, `tests/validator/nullable_optional_conflict.test.ts`.
Full: `npm test`.

## Risks & Mitigations
- Risk: Manual reconstruction of previous grammar introduces new ambiguity. Mitigation: add minimal targeted parser tests (create/update/delete + webhook) before full run.
- Risk: Changing validator messages breaks other snapshots. Mitigation: search for `Optional list type not allowed` across tests before altering phrase.
- Risk: on_delete builder mapping may alter generated Prisma schema. Mitigation: run prisma-related tests after relation fix.

## Done Criteria
- All tests green.
- Grammar self-analysis yields zero definition errors.
- No new snapshot updates required beyond intentional changes (route generation unaffected).

## Next After Green (Optional)
- Introduce automated rule naming/duplicate numbering lint script.
- Add docs snippet test for each workflow trigger variant.

## Current Status Summary
[ ] Step 1 pending (major blocker).
[ ] Steps 2–7 pending.
All other suites currently passing (160 green) show stability outside workflow & new grammar scope.

---
This file supersedes previous checklist version.
