---
title: Advanced API Validation Patterns
description: Advanced usage of Locus validators: patch vs update, relation connect, BigInt & Date handling, JIT mode, customization hooks.
---

# Advanced API Validation Patterns

This guide expands on the core validator behavior with patterns for complex input flows.

## 1. Update vs Patch

| Mode | Intent | Required Checks | Null Handling |
|------|--------|-----------------|---------------|
| create | Full resource creation | Enforced for non-optional fields | Not allowed unless nullable semantics added later |
| update | Semantic full replacement (currently same as create schema) | Required enforced | Same as create |
| patch | Partial change | Missing fields ignored | Present fields validated |

## 2. Relation Connect Shapes

Validators accept relation references in a minimal shape:

```
user: { connect: { id: "user_123" } }
items: [ { connect: { id: 1 } }, { connect: { id: 2 } } ]
```

Invalid shapes produce `relation_shape` errors. Nested inlined create bodies are intentionally not yet supported (will layer on later with explicit `create` blocks).

## 3. BigInt Strategy

BigInt fields accept:
- JavaScript `bigint` literals (normalized to string)
- Safe integer numbers (converted to string)
- Base-10 string digits (validated)

Invalid forms raise `bigint_format` or `bigint_range`. At generation time, downstream layers can parse back to native bigints if desired.

## 4. Date Canonicalization

`DateTime` fields must be ISO8601 (`YYYY-MM-DDTHH:MM(:SS(.sss))?(Z|±HH:MM)`). Values are normalized to `.toISOString()`; malformed inputs produce `date_format`.

## 5. JIT Validation Mode

Set `LOCUS_VALIDATION_JIT=1` to enable a fast, specialized validator path. The JIT handles a subset (core scalar & constraint checks) and falls back to the standard engine for advanced behaviors. Always verify parity with baseline before enabling in production (see `jit_consistency.test.ts`).

## 6. Hooks Recap

| Hook | Purpose |
|------|---------|
| `registerPreValidationTransform` | Mutate / default body before validation |
| `registerValidationConstraint` | Custom field-level constraint checks |
| `registerValidationLogger` | Emit timing & outcome events |

## 7. Rate Limiting Telemetry

If validation failures exceed `LOCUS_VALIDATION_FAIL_LIMIT` (default 200 / min / entity) a `meta.rateLimited=true` flag appears. Combine with `LOCUS_VALIDATION_LOG=1` for structured stderr JSON logs.

## 8. Opt-Out Scenarios

For emergency debugging set `LOCUS_VALIDATION_DISABLE=1`. This should never be a long-term configuration.

## 9. Error Envelope Versioning

Envelope includes `version:1` so future format changes are versioned (e.g., spans, i18n payloads, aggregated groups).

## 10. Coming Soon

Planned additions: nested inlined creates, nullable semantics, richer polymorphic discriminator flows, i18n message overrides, structured span ranges.
