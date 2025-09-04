## Syntax Conventions

This reference captures canonical (post‑overhaul) surface syntax. Use it as the single source of truth when writing or updating examples elsewhere in the docs.

### Attributes / Annotations
Legacy paren attributes `(unique) (default: 5)` have migrated to `@` form:

```locus
entity User {
  id: Integer @id @unique
  email: String @unique
  status: String @default("active")
}
```

Canonical ordering (apply when multiple on a field):
1. `@id`
2. `@unique`
3. `@default(...)`
4. `@map(...)`
5. `@policy(...)`
6. Plugin / custom attributes (alphabetical)

### Optional vs Nullable

| Form | Meaning | Stores NULL? | Can be omitted in input? |
|------|---------|--------------|---------------------------|
| `name: String?` | Optional (not nullable) | No (future: omission) | Yes |
| `name: String | Null` | Nullable (required presence) | Yes | No (value must appear) |
| `name: String? | Null` | Optional + Nullable | Yes | Yes |

See full guide: `nullable-vs-optional.md`.

### Lists
Use array shorthand `Type[]` in new examples (or `list of Type` legacy). Lists cannot be optional (`[]?` invalid) and cannot have `@default`.

### Events & Bindings (UI)
* `on:click` normalizes to `onClick`.
* Lower‑case handler props (e.g. `onclick`) trigger a capitalization warning with a suggestion.
* `bind:value={x}` internally becomes `bindValue` (or `bind$prop` form for general binds) before expansion.

### Workflow Constraints
* `retry { max: 0..100, backoff: fixed|exponential, factor>1 if exponential }`
* `concurrency { limit: 1..10000 }`
* Webhook + entity triggers may not be mixed.
* `send_email` requires `to` plus at least one of `subject` or `template`.

### Deprecations (Active / Recent)
| Legacy | Current | Status |
|--------|---------|--------|
| `(attr)` paren attributes | `@attr` | Warn (hard error behind gate) |
| `list of Type` | `Type[]` | Supported (legacy form slated for future warning) |
| Optional list marker (`list of T?`) | Remove `?` | Disallowed |
| Legacy UI lowercase events (`onclick=`) | `on:click=` (→ onClick) | Warn (suggest fix) |

### Determinism
When documenting outputs, list object keys and arrays in stable, sorted order to match generator determinism (prevents snapshot churn).

---
_Last updated: 2025-09-04_