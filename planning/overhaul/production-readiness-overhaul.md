# Locus Language Overhaul & Production Readiness Plan

Goal: Evolve Locus from early prototype into a stable, predictable, developer‑friendly DSL that cleanly unifies data, design, UI, workflow, and generation — while preserving core tenets: (1) Clarity, (2) Exceptional DX & error reporting, (3) No silent failures.

## 0. Guiding Principles (Reaffirmed)
- Clarity over cleverness: every construct must be guessable.
- One obvious way: eliminate parallel / redundant syntaxes.
- Deterministic outputs: identical input => identical codegen (ordering, hashing, formatting).
- Fail fast, fail helpfully: every user-visible anomaly becomes a structured error with precise span.
- Progressive extensibility: future features gated & versioned without breaking existing code.

## 1. Syntax & Grammar Coherence
| Issue | Impact | Action | Priority |
|-------|--------|--------|----------|
| Mixed parsing strategies (Chevrotain + ad‑hoc regex UI/state parsing) | Inconsistent error spans, harder maintenance | Fold UI + state + actions grammar into Chevrotain (second phase) or build a unified mini-parser with shared token stream; emit CST for all | High |
| `Identifier` used for pseudo-keywords (e.g. `else`) | Hidden bugs & unclear diagnostics | Reserve all structural keywords (`else`, `elseif`, `guard`, `in`) as explicit tokens | High |
| Workflow raw sections vs structured steps | Partial semantics; validation gaps | Formal workflow grammar (triggers, steps, retry config as key/value schema) | High |
| Optional list type allowed then rejected | Cognitive friction | Disallow `?` after `list` in grammar; produce parse error (not post validation) | High |
| Style override opaque hack (sanitization) | Potential misaligned locations; hidden syntax errors | Introduce explicit `style_override {}` block with limited CSS-ish token pass-through + proper brace tracking | Medium |
| Two-word constructs (`on load`) vs single words | Inconsistent mental model | Normalize to `on_load` or `on load` as token pair but document and enforce one style (`on load`) | Low |
| `list of Type` verbose & inconsistent with primitives | Noise | Consider `Type[]` shorthand (keep `list of` as alias with deprecation notice) | Medium |

## 2. Naming & Consistency
- Enforce canonical snake_case for keywords (`design_system`, `has_many`) and PascalCase ONLY for user-defined types/entities/components.
- Unified attribute style: move from parentheses `(<attr>)` to annotation prefix (e.g. `@unique`, `@default(…)`, `@map("...")`) or keep both temporarily with warnings; choose one (recommend annotations — aligns with ecosystem familiarity).
- Standardize workflow step names: kebab or snake (pick snake). E.g. `send_email`, `http_request` already aligned.

## 3. Type System & Validation
| Area | Improvement | Detail |
|------|-------------|--------|
| Primitive coverage | Explicit numeric flavors | Add `BigInt`, `Float`, `UUID`, `Email`, `URL` (mapped to generator capabilities). |
| Nullable vs Optional | Clear model | Distinguish `?` (optional field presence) vs `nullable` (explicit null allowed) using `?` vs `| Null` or `?` vs `nullable` keyword; decide and document. |
| Lists | Deterministic semantics | Remove ambiguous optional list flag; lists always present (possibly empty). |
| Defaults | Expression sandbox | Restrict default function calls to vetted whitelist; validate argument types. |
| Relations | Referential integrity hints | Allow explicit inverse specification and cascade policies (`on_delete: cascade|restrict`). |
| Cross-block references | Early validation | Validate workflow actions reference existing `action` declarations or plugin-provided operations. |
| Workflow config | Strong schema | Parse `retry { max: Int backoff: fixed|exponential factor: Int delay: Duration }` with typed conversions + range checks. |
| UI expressions | Formal expressions | Reuse expression grammar to parse all `{...}` inside UI attributes; produce AST for future type checking. |

## 4. Error Reporting Upgrades
| Gap | Improvement |
|-----|------------|
| Regex-derived spans (state/action) | Provide precise token spans via unified CST. |
| Raw workflow sections lack structure | Provide per-key span in `retry`, `trigger` event spec, etc. |
| Multi-token suggestions | Implement nearest keyword suggestion (Levenshtein on token set) for unknown keyword. |
| Attribute misuse | Specific messages: "`@default` not allowed on list fields" emitted at attribute site. |
| Quick fixes | Include suggested replacement snippet in error metadata (foundation for IDE integration). |

## 5. Workflow System Maturation
- Formal Trigger DSL: `trigger { on: create(Entity) | update(Entity) | webhook(secret: NAME) }` with structured AST.
- Step Types Roadmap: `run`, `http_request`, `delay`, `branch`, `for_each`, `parallel`, `send_email`, `queue_publish`, `db_tx`, `custom <pluginStep>`.
- Deterministic Step IDs: assign stable incremental IDs for trace correlation.
- Branch & ForEach semantics: typed condition / collection expression validation.
- Failure policies: unify `on_error` & `on_failure` semantics; consider single `catch` with filters.

## 6. UI / Component Model
| Issue | Action |
|-------|--------|
| Ad-hoc slot detection via naming convention | Introduce explicit `<slot name="header"/>` & `{slot.header}` consumption; infer `children` only if referenced. |
| Imperative event naming `on:click` only | Support `on:submit`, custom events; validate allowed set or allow pass-through with warning. |
| Conditionals / loops as pseudo-elements | Add directive syntax: `{#if expr}...{/if}` `{#each items as item}` for familiarity (optionally keep legacy, deprecate) OR keep existing but document thoroughly. |
| Expression opacity | Parse and type-check all `{expr}` with uniform grammar. |

## 7. Extensibility & Plugins
- Stable Plugin API surfaces: parse hook (augment AST), validate hook, generator hook, workflow runtime hook.
- Capability declaration: plugins declare added keywords / step kinds -> central registry updates lexer/token ordering.
- Version gating: feature flags in `locus.config` enabling experimental syntax (prevents breaking future additions).

## 8. Determinism & Formatting
- Provide canonical formatter (idempotent) for `.locus` files (token stream → pretty printer) to eliminate whitespace diffs.
- Stable ordering rules: entities alphabetical, fields in source order (or sorted if beneficial), design tokens sorted by key.

## 9. Security & Real-World Hardening
| Vector | Mitigation |
|--------|------------|
| Arbitrary code in defaults/workflows | Whitelist limited pure intrinsic functions; no eval / dynamic require. |
| Secret leakage (`webhook` triggers) | Enforce naming convention; integrate secret reference validation against env manifest. |
| Email step injection | Validate and sanitize interpolations; restrict template lookup to safe paths. |
| HTTP request step | Restrict to https by default; allow opt-out with explicit flag. |

## 10. Performance & Scalability
| Area | Improvement |
|------|------------|
| Incremental parsing | Track per-block content hash; reparse only changed blocks (modular CST). |
| Large projects | Introduce parallel parse worker pool (Node worker threads) with bounded concurrency. |
| Memory | Use compact AST node representation (numeric enums for kinds). |
| Workflow runtime | Precompile expressions to optimized JS functions with caching. |

## 11. Tooling & CLI UX
- `locus check`: fast parse + validate without generation.
- `locus format`: applies formatter.
- `--explain <errorCode>`: show extended guidance & examples.
- Rich diff in incremental builds: report changed blocks & impacted outputs.

## 12. Migration & Versioning Strategy
| Phase | Scope | Notes |
|-------|-------|-------|
| 1 (Stabilize Core) | Grammar cleanup, reserved keywords, forbid optional list | No breaking output changes beyond errors becoming earlier. |
| 2 (Structured Workflows) | Full workflow grammar, expression unification | Feature flag `workflows.v2`. |
| 3 (UI Formalization) | CST-backed UI + slots + expression parsing | Deprecate legacy pseudo-elements after warning cycle. |
| 4 (Annotations) | Replace paren attributes with `@` form | Dual support; emit deprecation warnings. |
| 5 (Plugins & Extensibility) | Capability registry & plugin API versioning | Semantic version gates. |

## 13. Backwards Compatibility Plan
- Deprecation warnings with codeframe + suggested rewrite + target removal version.
- Config: `locus.config` supports `suppressDeprecated: ['attributeParens']` for controlled silencing.

## 14. Testing Enhancements
| Gap | Addition |
|-----|----------|
| Limited property tests | Add fuzz tests for parser (random valid entity definitions) to ensure no crashes. |
| Missing cross-module tests | Scenario tests generating full stack (db + design + workflow + UI). |
| Performance regressions | Track parse time & memory baseline in CI (threshold budgets). |
| Error snapshot brittleness | Abstract dynamic numbers (timestamps) before snapshot. |

## 15. Documentation & Discoverability
- Autogenerated spec from grammar (render Chevrotain rules → markdown tables).
- Error catalog with examples.
- Quick Reference (cheatsheet) reflecting canonical forms only.
- Migration guides per phase.

## 16. Implementation Ordering (Actionable Backlog)
1. Reserve keywords + forbid optional list (small, high leverage).
2. Introduce annotation attribute syntax (dual mode) + deprecation warnings.
3. Formal retry/trigger grammar (structured workflow sections).
4. Unified expression grammar adoption in UI & workflows.
5. Structured workflow step expansion (parallel, http_request details, send_email formal fields).
6. UI CST integration + slot syntax.
7. Formatter & deterministic ordering.
8. Plugin capability registry.
9. Security validations (secrets, HTTP restrictions, email sanitization).
10. Performance optimizations & worker parallelism.

## 17. Success Criteria (Definition of “Production Ready”)
| Domain | Metric / Condition |
|--------|--------------------|
| Syntax Stability | No breaking grammar changes for 6 months; versioned additions only. |
| Error Quality | 95%+ of parser/validator errors show precise span + actionable suggestion. |
| Determinism | Repeated full build of unchanged project yields zero diff (hash baseline). |
| Performance | <200ms cold parse of 50 typical files on CI baseline; incremental rebuild <50ms for single-file edit. |
| Security | No dynamic code execution paths without explicit opt-in flag. |
| Extensibility | Plugin adding new workflow step requires zero core code edits (registry-based). |

## 18. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Grammar churn delaying adoption | Lock phases; publish roadmap and migration timelines. |
| Token ordering fragility | Generate token list from declarative spec to avoid manual ordering mistakes. |
| Complexity creep | Add acceptance gate: every new construct must justify against core tenets (template). |
| Silent regressions in codegen | Snapshot + contract tests + output hash compare stage in CI. |

## 19. Drop / Defer List
- Complex conditional UI DSL variants (choose one approach before GA).
- Arbitrary workflow scripting (avoid until expression safety + sandbox solved).
- Inline CSS parsing (keep opaque until style system requirements clarified).

## 20. Summary
This plan consolidates Locus into a coherent, fully specified DSL: unified parsing, explicit keywords, richer validation, structured workflows, formal UI semantics, clearer attributes, powerful yet safe extensibility, and uncompromising error quality — all while minimizing cognitive load and maximizing predictability.

---
Prepared to align with the existing philosophy: clarity, DX, loud helpful errors, deterministic generation.
