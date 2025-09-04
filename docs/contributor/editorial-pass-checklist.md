# Final Editorial Pass Checklist (Placeholder)

Use this checklist before marking docs overhaul complete:

## Consistency
- Terminology matches language spec (annotations, bindings, workflows).
- Attribute ordering examples follow canonical order.

## Style
- Heading capitalization consistent (Title Case for H2+).
- No passive voice in critical instructions.

## Accuracy
- All CLI flags present in `cli.md` exist in `src/index.ts` (validate with script).
- No legacy paren attributes outside migration guide.

## Links
- All internal links resolve (validated by script).
- External links (critical) tested manually.

## Examples
- Every ` ```locus ` block parses unless marked partial.
- Negative examples clearly marked.

## Performance Claims
- Parse + memory budgets reflect latest benchmark JSON.

## Security
- Redaction placeholder + telemetry placeholder linked from security guide.

---
_Last updated: 2025-09-04_