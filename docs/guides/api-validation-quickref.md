---
title: API Validation Quick Reference
description: Fast lookup for common validator environment variables, hooks, and error codes.
---

# API Validation Quick Reference

## Environment Variables
| Var | Description |
|-----|-------------|
| `LOCUS_VALIDATION_DISABLE` | Bypass validation (debug only) |
| `LOCUS_VALIDATION_JIT` | Enable JIT fast-path validator |
| `LOCUS_VALIDATION_FAIL_LIMIT` | Failure rate threshold (per entity / minute) |
| `LOCUS_VALIDATION_LOG` | Emit structured JSON logs to stderr |

## Generated Functions
| Function | Mode |
|----------|------|
| `validate<Entity>Body` | create |
| `validate<Entity>Update` | update |
| `validate<Entity>Patch` | patch |

## Error Codes (Core)
`required`, `type_mismatch`, `min`, `max`, `length`, `pattern`, `pattern_complexity`, `email`, `enum`, `invalid_chars`, `body_size_exceeded`, `array_length_exceeded`, `depth_exceeded`, `unexpected_property`, `disallowed_key`, `relation_shape`, `date_format`, `bigint_format`, `bigint_range`.

## Hooks
`registerPreValidationTransform`, `registerValidationConstraint`, `registerValidationLogger`.

## Relation Connect Shape
```
child: { connect: { id: "child_id" } }
children: [ { connect: { id: 1 } } ]
```

## Patch vs Update
- Patch: omissions ignored.
- Update: required rules same as create (current model).
