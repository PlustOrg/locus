# UI Parser Interim Strategy

The current UI parsing approach is a handcrafted lexical + structural pass rather than a full Chevrotain grammar. This document captures why, limitations, and migration path.

## Why Not Chevrotain Yet?
- Rapid iteration on syntax (slots, bindings, event casing) without grammar churn.
- Simpler error surface while core constructs stabilize.
- Avoid early performance cost of complex CST building.

## Current Architecture
1. Pre-tokenize into elements, text, and directive-like attributes.
2. Normalize events (`on:click` → `onClick`) and bindings (`bind:value` → internal `bindValue`).
3. Track location spans for each node for high-fidelity diagnostics.
4. Produce a lightweight AST consumed by validator and generators.

## Limitations
| Area | Limitation | Impact |
|------|------------|--------|
| Error recovery | Fails fast on malformed tag nesting | Clear errors, no partial tree |
| Expressions | Only shallow validation; no full expression grammar | Some runtime issues deferred |
| Custom directives | Hard-coded normalization patterns | Plugin extension pending |
| Incremental parsing | Full-file reparse on change | Future perf target |

## Migration Path
| Phase | Action | Benefit |
|-------|--------|---------|
| 1 | Stabilize slot & binding syntax | Freeze surface for grammar spec |
| 2 | Generate Chevrotain token set for UI mode | Unified lexer strategy |
| 3 | Implement UI CST + builder | Richer validation opportunities |
| 4 | Incremental subtree reparse using spans | Faster dev cycle |

## Contributing Guidance
- Keep transforms deterministic; avoid data-dependent randomization.
- Always populate `loc` objects when introducing new node types.
- Document new normalization rules in `ui-syntax.md` and `reference/conventions.md`.

## Open Questions
- Best approach for embedding expression grammar (reuse existing or dedicated UI expression tokens)?
- Scope of plugin hooks for UI AST interception?

---
_Last updated: 2025-09-04_
