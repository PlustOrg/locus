# Documentation Overhaul Checklist (September 2025)

Goal: Align all docs with the post‑overhaul language, validator, UI parsing, plugin system, performance budgets, and deprecation status. Each task is framed as an actionable doc change. Use this list to drive a focused doc sprint; prune items once completed (archive in a dated snapshot if needed).

Legend: P0 Critical drift / must fix before next release | P1 Important | P2 Nice-to-have polish | P3 Future / blocked

---
## 1. Global Consistency & Navigation
- [x] (P0) Update any remaining references to legacy paren attributes `(unique)` etc. (notably in `language/data-modeling.md` field attributes section) to the `@` annotation form; include migration note + link to `annotations-migration.md`.
	- [x] Includes updates in introduction overview examples.
- [x] (P0) Insert a global “Syntax Conventions” snippet (annotations, optional vs nullable, list semantics) to `docs/index.md` or a new short `reference/conventions.md`; cross-link from Getting Started, Data Modeling, UI Syntax.
- [x] (P1) Add UI Lexical Mode & Location Metadata entry to main index navigation (currently missing `ui-lexical-mode.md`).
 - [x] (P1) Ensure every guide that mentions validation references structured error spans (add short blurb + example codeframe) using new UI diagnostics helper.
 - [x] (P1) Add reference to `locus doctor` JSON output fields (flags, pluginPerfCache presence, env filtering) plus sample output.
 - [x] (P1) Explain workflow JIT benchmark methodology & acceptable variance threshold; link to future test stabilization plan.
 - [x] (P0) Script / CI check to parse every code block (ensure new/changed examples compile with updated syntax) – add docs section describing how snippet validation works / how to opt out for illustrative pseudo-code.
 - [x] (P1) Add label comments above examples that are intentionally partial (`// snippet: partial`).
 - [x] (P1) Add redaction policy placeholder (document that sensitive values are not currently emitted; invite feedback on proposed mask strategy).
- [x] (P1) Add warning callout for list fields: optional marker disallowed (error) & defaults on list fields currently unsupported.
- [x] (P2) Add subsection on integer default function whitelist (`now`, `uuid`, `cuid`, `autoincrement`) with invalid example + error message.

## 3. UI Syntax & Component Model
- [x] (P0) Document lowercase event handler warning (e.g. `onclick` → suggestion `onClick`).
- [x] (P0) Clarify binding normalization: `on:click` → `onClick`, `bind:value` becomes `bindValue` internally then expands during generation (include example).
- [x] (P1) Add section "Location Metadata & Codeframes" in `ui-syntax.md` linking to `ui-lexical-mode.md` with sample output of `locus ui:ast`.
- [x] (P1) Add slot example referencing new slot syntax `<slot name="header"/>` and how consumed via `{slot.header}`.
- [x] (P2) Add guidance on performance of large UI trees (emphasize deterministic transform + spans for incremental validation planned).

## 4. Workflows Documentation
- [x] (P0) Sync Feature Matrix with current validator: include `send_email` validation rules (subject OR template), `http_request` placeholder, concurrency limit range (1..10000), retry factor >1 for exponential.
- [x] (P0) Add explicit validation error snippets for: mixing webhook + entity triggers, invalid retry.max, invalid concurrency.limit, missing run step action, invalid send_email fields.
- [x] (P1) Describe JIT compilation flag/env (`LOCUS_WORKFLOW_JIT`) and current performance caveats (hot path vs interpreter) in a short "Performance" subsection.
- [x] (P1) Add note about reserved / inferred bindings (auto-detected identifiers in UI for components & workflow steps binding uniqueness) with validator warnings.
- [x] (P2) Highlight plugin-defined step kinds registration with concise example (align with actual API names if changed) and pointer to plugin author guide.

## 5. Plugins & Extensibility
- [x] (P0) Update plugin guide to include new performance budget reporting & where timing diffs are persisted.
- [x] (P1) Add subsection on security flags: `LOCUS_PLUGIN_ISOLATE`, `LOCUS_PLUGIN_HOOK_MEM_KB`, `LOCUS_PLUGIN_ALLOW` (module allow-list).
- [x] (P1) Add warning that unrecognized step kinds must be registered via `registerWorkflowStepKinds()` (present link to workflows doc).
- [x] (P2) Provide minimal example of adding a virtual AST component with `uiAst` including span metadata fields (demonstrate introspection possibility).

## 6. Design System & Theming
- [x] (P1) Update design system guide to clarify which token categories now have validator rules (hex color validation, typography weight ranges) vs those still inert.
- [x] (P1) Add warning callout for invalid color token values (non-hex) with sample error.
- [x] (P2) Add planned roadmap table for future CSS generation of typography/spacing/radii/shadows referencing GA sections.

## 7. CLI & Tooling Docs
- [x] (P0) Add `ui:ast` command to CLI reference (stdin usage example).
- [x] (P0) Document CLI update notification behavior & opt-out env `LOCUS_NO_UPDATE_CHECK=1`.
- [x] (P1) Add reference to `locus doctor` JSON output fields (flags, pluginPerfCache presence, env filtering) plus sample output.
- [x] (P2) Add note about deterministic build hash test and how to interpret differences.
- [x] (P2) Provide guidance on using `--dry-run` with plugin generators to audit artifacts before writing.

## 8. Performance & Budgets
- [x] (P0) Create/Update doc section (new `guides/performance.md` or extend README) listing locked parse time & memory budgets (13MB / <180ms), and memory delta tracking across phases.
- [x] (P1) Explain workflow JIT benchmark methodology & acceptable variance threshold; link to future test stabilization plan.
- [x] (P2) Add brief note on determinism requirement (sort keys, stable ordering) and how snapshot tests rely on it.

## 9. Security & Hardening
- [x] (P0) Update security checklist to reflect implemented items (plugin sandbox flag, memory guard, JIT opt-in) and mark remaining future tasks; ensure each has guidance or link.
- [x] (P1) Add redaction policy placeholder (document that sensitive values are not currently emitted; invite feedback on proposed mask strategy).
- [x] (P2) Add future item for telemetry opt-in design (link Post-GA section).

## 10. Migration & Deprecations
- [x] (P0) Ensure `annotations-migration.md` includes final removal policy (usage count threshold OR version >=0.6.0) and example deprecation warning message format.
- [x] (P0) Add consolidated deprecations table (legacy attribute parens, list optional marker, future UI legacy directives) with status columns: Parse Warn, Validation Error (gate), Removed.
- [x] (P1) Add instructions for running build with removal gate: `REMOVE_PAREN_ATTRS=1 locus build` and interpreting resulting errors.
- [x] (P2) Add guidance for teams tracking deprecation metrics (where counts appear, how to export).

## 11. Quick Reference & Cheat Sheets
- [x] (P0) Update `quick-reference.md` to replace `list of` + legacy attribute examples with modern syntax (`Type[]`, `@id`, `@unique`, `@default()`), and add reserved triggers keywords if missing.
- [x] (P1) Add section for workflow step kinds with concise one-liners.
- [x] (P2) Include optional vs nullable grid and example error snippet.

## 12. Getting Started Flow
- [x] (P1) Replace legacy attribute usage `(unique)` in the Getting Started guide with `@unique`.
- [x] (P1) Add note after first build about deprecation warnings (where they appear & how to suppress intentionally via config).
- [x] (P2) Provide optional step to run `locus doctor` to confirm environment.

## 13. Examples & Snippets Validation
- [x] (P0) Script / CI check to parse every code block (ensure new/changed examples compile with updated syntax) – add docs section describing how snippet validation works / how to opt out for illustrative pseudo-code.
- [x] (P1) Add label comments above examples that are intentionally partial (`// snippet: partial`).
- [x] (P2) Add contributor guidelines for adding versioned migration examples.

## 14. Internal / Contributor Docs
- [x] (P1) Add section on token spec generation & drift check (point devs to script + CI fail condition).
- [x] (P1) Document safe temp directory removal utility (`safeRemove`) rationale for flaky test mitigation.
- [x] (P2) Add brief design note on UI parser interim strategy (manual pass → future Chevrotain integration path) citing current limitations.

## 15. New / Proposed Docs Artifacts
- [x] (P1) Create `guides/performance.md` (if not extending existing) capturing budgets + JIT rationale.
- [x] (P2) Create `reference/conventions.md` for global syntax conventions (annotations order, nullable vs optional, list rules, event casing) and link everywhere.
- [x] (P3) Placeholder `guides/telemetry-opt-in.md` with rationale & privacy stance.

## 16. Verification & Quality Gates
- [x] (P0) Add `docs:check` enhancement to fail on legacy paren attribute patterns and `(default:` in docs.
- [x] (P1) Extend docs validation script to ensure every internal cross-link resolves (no 404 within repo).
- [x] (P1) Add check to ensure all code blocks that specify `locus` language parse successfully unless annotated `// snippet: partial`.
- [x] (P2) Add link consistency linter for heading slug changes (auto update anchors).

## 17. Tracking & Closure
- [x] (P0) Tag each merged doc PR with label `docs-overhaul` and maintain progress percent in README badge (optional small shield).
- [x] (P1) Archive completed tasks by generating `docs-overhaul-checklist.archive-<date>.md` when 90% complete.
- [x] (P2) Final editorial pass (tone, grammar, duplication) prior to marking docs overhaul complete.

---
Generated: 2025-09-04

Implementation Notes:
- Treat P0 items as blockers for next tagged release.
- Prefer iterative PRs: group by section (e.g., Data Modeling batch) to keep reviews tight.
- After each batch, run snippet parser validation before merging.
