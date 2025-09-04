# Versioned Migration Examples

Provide clear, side-by-side examples for users upgrading across breaking syntax changes.

## Goals
- Show BEFORE (old version) and AFTER (new version) states.
- Keep diffs minimal and focused on changed syntax.
- Avoid mixing unrelated refactors within migration examples.

## Structure
Place files under `docs/migrations/<feature>/<version>/` (planned). Each directory contains:
- `before.locus`
- `after.locus`
- `NOTES.md` (explains rationale, edge cases, automated rewrite hints)

## Inline Doc Usage
In guides, link to stable examples instead of embedding large diffs. Use a short excerpt + link:
```markdown
See full migration: [Paren Attributes → Annotations](../migrations/annotations/0.6.0/)
```

## Partial Snippets
Mark intentionally incomplete code with:
```locus
// snippet: partial
entity Example { /* ... */ }
```
The docs validator skips these.

## Review Checklist
- Are all removed tokens absent from AFTER example?
- Are new required annotations/fields present?
- Are ordering rules honored (e.g. attribute ordering)?
- Do examples stay under ~40 lines each?

## Automation (Planned)
A future `locus migrate --write` command may auto-generate BEFORE/AFTER pairs; contributor updates then refine wording in `NOTES.md`.

---
_Last updated: 2025-09-04_
