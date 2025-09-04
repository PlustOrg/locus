## Snippet Validation

All ` ```locus ` fenced blocks in the `docs/` directory are parsed and validated during `npm run docs:check`.

### What Happens
1. Each snippet is wrapped if necessary (UI fragments, elements, entities) to form a compilable unit.
2. The parser builds ASTs; semantic validation runs on each.
3. A deterministic hash of successful snippet code is compared against `.snippets.hash` to detect drift.
4. Failures (parse / validation / missing links) cause the check to exit non‑zero.

### Skipping Validation
Use one of these markers directly before or inside the fenced block:
* `<!-- skip-validate -->` comment above the fence.
* `// snippet: partial` comment inside the code (indicates intentionally incomplete code).

### Negative Examples
Negative / intentionally failing examples should be placed in prose (not fenced) or fenced with a skip marker and formatted as plain text or ` ```text `.

### Why This Exists
Early detection of syntax drift keeps the docs reliable and reduces example rot. Contributors get immediate feedback instead of shipping broken examples.

---
_Last updated: 2025-09-04_