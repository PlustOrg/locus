# Nullable vs Optional Migration Guide

This guide helps migrate code to the clarified semantics between optional fields (`?`) and nullable types (`| Null` or the `nullable` keyword).

## Summary

| Concept | Meaning | Example |
|---------|---------|---------|
| Optional Field | Field may be absent entirely | `email?: String` |
| Nullable Type | Field present; value may be null | `email: String | Null` |
| Both (discouraged) | Not allowed (validator error) | `email?: String | Null` |

## Rationale
Optional controls presence vs omission during create/update. Nullable encodes tri-state (value, null, omitted are distinct). This reduces accidental null propagation and improves generator determinism.

## Migration Steps
1. Identify fields using implicit null tolerance (previously `?` sometimes implied null). Decide if you want omission or explicit null.
2. If you need to allow client to send `null`, convert:
   `email?: String` -> `email: String | Null`
3. If you only need omission (not null), keep as optional.
4. Remove any combined usage (`?: ... | Null`). The compiler will surface a validation error with a suggested fix.

## Examples
```locus
entity User {
  id: Integer @id @default(autoincrement())
  // Optional (may be left out) but never null
  displayName?: String
  // Explicitly nullable
  bio: Text | Null
}
```

## Prisma Mapping Notes
- Optional non-nullable fields become Prisma optional without `?` defaulting semantics confusion.
- Nullable fields emit a comment marker for future inline null semantics handling until native support is finalized.

## Backward Compatibility
A transitional deprecation warning is emitted for legacy patterns until removal version. Set `suppressDeprecated` in config to hide warnings during incremental migration.

## Quick Reference
| Need | Use |
|------|-----|
| Field may be omitted | `field?: Type` |
| Field must be present (non-null) | `field: Type` |
| Field present but may be null | `field: Type | Null` |

---
Generated: 2025-09-12
