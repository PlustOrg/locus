# Nullable vs Optional Fields

This guide explains the distinction between optional and nullable field types in Locus.

## Concepts

- Optional (syntax: `field: Type?`) means the property may be omitted entirely when creating or updating. In persistence, its absence is treated as "unset"; future semantics will avoid writing a NULL explicitly.
- Nullable (syntax examples: `field: Type | Null`, `field: Type nullable`) means the property is present and allowed to hold a NULL database value.

These are intentionally different: an optional but non-nullable field has three logical states during input (omitted, provided non-null, provided null) but only two are valid (omitted or non-null). To store an actual NULL you must mark the type as nullable.

## Syntax Summary

```
name: String?             # optional, NOT nullable
middleName: String | Null # nullable (and implicitly required unless suffixed with ?)
comment: Text? | Null     # optional AND nullable (can be omitted or set explicitly to null)
flag: Integer nullable    # keyword form
```

Order is not significant; both `Text? | Null` and `Text | Null?` are normalized internally.

## Validation Rules

- A default of `null` on an optional-but-not-nullable field is invalid. Remove the default or add `| Null`.
- List types ignore `?` (lists are always present, use empty list) and will error if the legacy optional marker appears.

## Prisma Mapping (Current)

At present both optional and nullable compile to Prisma's `?` suffixed field for simplicity. Future differentiation will:

- Optional only: treat absence as omission (no write) while still represented as optional in app layer.
- Nullable: mapped to underlying `Type?` but generation logic will emit sentinel handling for explicit null writes.

## Migration from Legacy Behavior

Historically `?` implied both optional and nullable. To migrate:

| Legacy | New Explicit Form |
|--------|-------------------|
| `name: String?` intending nullable | `name: String | Null` |
| `name: String?` intending optional (not nullable) | keep as-is |

## FAQs

1. Why separate them? Clarity in API semantics (omit vs explicit null) and enabling future diff-based update optimization.
2. How to allow explicit null updates? Add `| Null`.

## Next Steps

The generator will evolve to produce different runtime handling once nullable semantics diverge. Track progress in `overhaul-checklist.md` under Nullable vs Optional divergence.
