---
title: API Input Validation
description: How Locus validates API request bodies, params, and query inputs.
---

# API Input Validation

Locus generates deterministic runtime validators for each entity-based route. Validation occurs before any database or business logic is executed.

## What is Validated

- Body JSON fields (type, required/optional, constraints)
- Route params (numeric coercion & validation)
- Query parameters (pagination, filtering – evolving)
- Headers (configurable required set via middleware)

## Constraint Annotations

| Annotation | Description |
|------------|-------------|
| `@min(n)` | Minimum numeric value |
| `@max(n)` | Maximum numeric value |
| `@length(min,max)` | String length bounds |
| `@pattern("regex")` | Regex pattern match (JS syntax) |
| `@email` | Email format check |
| `@enum("A","B",...)` | Restrict value to enumerated set |
| `@discriminator` | Marks field as required polymorphic discriminator (max one) |
| `@message("text")` | Override default error message for type/enum violations |

## Error Envelope

```
{ "version":1, "code": "validation_error", "errors": [ { "path": "field", "message": "...", "code": "min" } ] }
```

`path` uses dot & bracket notation for nested/array values. Ordering of errors is deterministic by path.

## Security Hardening

- Depth limit (default 8)
- Array length limit (default 1000)
- Body size limit (default 64KB)
- Per-string field size cap (10KB)
- Prototype pollution key rejection

## Partial Updates

PUT routes use an `updateSchema` with all fields optional while preserving constraint enforcement on provided fields.

## Middleware Utilities

`makeValidator(validatorFn)` – wrap a generated validator as Express middleware.

`requiredHeadersMiddleware(["x-api-key"])` – enforce required headers.

## Roadmap

- Enum + custom plugin validators (extensible interface)
- Fuzz & performance regression suites integrated in CI
- Structured span mapping for error messages (locations metadata present; full path spans planned)
- Nested relation validation rules
- Rate-limit telemetry & structured logging integration flags
- See Advanced Patterns guide for patch vs update, relation connect, JIT mode
