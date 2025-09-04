# Token Spec Generation & Drift Check

The lexer & token definitions underpin deterministic parsing. Drift between documented tokens and implementation can cause confusing diagnostics.

## Source of Truth
`src/parser/tokens.ts` exports all Chevrotain tokens in a specific order. Keyword tokens must precede generic identifiers; `Unknown` stays last.

## Drift Detection (Planned Script)
A future script (`npm run check:tokens`) will:
1. Parse `tokens.ts` extracting token names & patterns.
2. Compare against a cached JSON snapshot `scripts/token-spec.json`.
3. Fail CI if new/removed/reordered tokens appear without snapshot update.

## Updating the Snapshot
After intentional token changes:
```bash
npm run update:token-spec
```
Commit the updated `token-spec.json`.

## Documentation Sync
When adding tokens (e.g. new keyword), update:
- `docs/reference/conventions.md` if it affects syntax conventions.
- Any examples relying on the new token.

## Ordering Rules Recap
1. Keywords (longest / most specific first)
2. Symbols / punctuation
3. Identifiers
4. Whitespace / comments (hidden)
5. Error recovery / Unknown (last)

## Validation
Until the script lands, reviewers should manually inspect token additions for ordering & unintended shadowing.

---
_Last updated: 2025-09-04_
