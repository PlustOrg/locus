# Migration Guide: Structured Workflows

Structured workflow grammar (Phase 2+) replaces ad-hoc unstructured step blocks with explicit sections:

```
workflow EmailUser {
  trigger { on:create(User) }
  concurrency { group: UserEmail limit: 1 }
  retry { max: 3 backoff: exponential factor: 2 }
  steps {
    run prepare()
    forEach u in users { run notify(user: u) }
    send_email { to: user.email subject: Welcome }
  }
  on_failure { run cleanup() }
}
```

## Changes vs Legacy
- `trigger { ... }` required (previously optional)
- `retry {}` and `concurrency {}` blocks parsed into typed objects
- `forEach` now `forEach var in expr { ... }` (legacy inline forms deprecated)
- `send_email` fields parsed structurally; subject/template validations added

## Deprecations
Legacy attribute parentheses `(attr)` still parse but emit deprecation warnings; switch to `@attr`.

## Action Items
1. Add missing `trigger { t }` to legacy workflows.
2. Replace any legacy loop syntax with `forEach item in items { ... }`.
3. Update send email steps to explicit block form if using inline variant.

## Tooling
Run `locus build` to view deprecation warnings. Use `--suppress-warnings` to hide them temporarily.
