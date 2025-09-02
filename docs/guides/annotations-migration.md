# Annotations Migration Guide

Legacy Locus syntax supported parenthesized field / relation annotations, e.g.:

```
entity User {
  id: Integer (id)       // legacy style
  email: String (unique) // legacy style
}
```

Canonical form uses `@` annotations (and allows parameters):

```
entity User {
  id: Integer @id
  email: String @unique
  status: String @default("active")
  role: String @policy(cascade)
}
```

## Mapping Table

| Legacy Paren | New `@` Form |
|--------------|--------------|
| `(id)` | `@id` |
| `(unique)` | `@unique` |
| `(default: 5)` | `@default(5)` |
| `(policy: cascade)` | `@policy(cascade)` |

Multiple legacy paren attributes become multiple `@` annotations separated by spaces.

### Multi-attribute Before / After

Before:

```
entity Post {
  id: Integer (id) (unique)
  status: String (default: "draft") (policy: cascade)
}
```

After:

```
entity Post {
  id: Integer @id @unique
  status: String @default("draft") @policy(cascade)
}
```

## Auto-Fix Strategy (Planned)

The validator emits a deprecation warning referencing the legacy form and suggesting a replacement. A future `locus fix` command will:

1. Parse each legacy attribute occurrence.
2. Rewrite to `@attr` (parameters become parenthesis arguments, `policy: cascade` -> `@policy(cascade)`).
3. Order attributes according to canonical ordering (see below).

## Canonical Ordering

Attributes are normalized to this order:

1. `@id`
2. `@unique`
3. `@default(...)`
4. `@map(...)`
5. `@policy(...)`
6. Any plugin / custom attributes (sorted alphabetically thereafter)

## Removal Timeline

When usage count for legacy syntax hits zero (tracked via deprecation metrics) or after the specified removal version/date (see deprecation warnings), the parser gate (`REMOVE_PAREN_ATTRS=1`) can be enabled in CI to turn remaining occurrences into hard errors.

## FAQ

**Q: Why migrate?**  Consistency with broader ecosystem (Prisma, etc.) and richer attribute parameter syntax.

**Q: Will code generation change?** No runtime change; it's a surface syntax upgrade. Generators already consume normalized attribute data.

**Q: How do I bulk migrate?** Run forthcoming `locus fix` or use a regex: `\((unique|id)\)` -> `@$1` and convert `\(default: (.*?)\)` -> `@default($1)` etc.

---
Track progress in `overhaul-checklist.md` under Attribute annotation migration.
