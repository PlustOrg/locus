# Workflows

Declaratively describe background and event-driven processes in your application: trigger something, run actions, branch, iterate, send an email, retry on failure, and plug in custom step kinds — all in one cohesive block.

> Status: **Experimental / MVP** (workflow manifest version `2`). Syntax and behavior may evolve; we aim to keep changes additive when possible.

---
## At a Glance

```locus
workflow WelcomeEmail {
  trigger { on:webhook(secret: HOOK_SECRET) }
  steps {
    run hydrateUser(userId)
    branch { condition: userIsAdmin steps { run auditAccess(userId) } else { run recordStandardLogin(userId) } }
    send_email {
      to: userEmail
      subject: Welcome
      template: welcome_template.html
    }
  }
  retry { max: 2, backoff: exponential, factor: 2 }
  concurrency { group: welcomeGroup, limit: 5 }
}
```

---
## Feature Matrix

| Capability | Implemented | Notes |
| ---------- | ----------- | ----- |
| `trigger` (webhook + basic entity events) | Yes | Webhook secret captured in manifest (`triggerMeta`). |
| `steps` block & core step kinds | Yes | `run`, `delay`, `branch`, `for_each`, `send_email`, `http_request` (placeholder). |
| `run` step arg parsing + simple expression capture | Yes | Single argument expression parsed for future analysis. |
| `branch` condition expression (simple) | Yes (heuristic) | Advanced boolean / nested parsing is incremental. |
| `forEach` loop | Yes | Iterates array-like value; binding injected per item. |
| `send_email` (to + subject/template validation) | Yes | Manifest includes structured fields. Future: richer templating. |
| `http_request` | Placeholder | Parsed & surfaced; execution logic not yet implemented. |
| `retry` block | Yes | `max`, `backoff` (`fixed|exponential`), `factor`, `delay` captured & validated. |
| `concurrency` block | Yes | FIFO queue simulation (no real async scheduling yet). |
| `on_error` block | Yes (basic) | Runs listed actions after failure before fallback. |
| `on_failure` block | Yes | Fallback if no `on_error`. |
| Workflow manifest JSON (v2) | Yes | Generated under `generated/workflows/`. |
| Custom step kinds via plugins | Yes | Register with `registerWorkflowStepKinds()`. |
| Precise error spans for all constructs | Partial | Improved for `send_email`; more coming. |
| State/input schema serialization | Not yet | Raw text only for now. |
| Advanced scheduling / cancel policy / jitter | Not yet | Future phases. |
| Type inference / semantic resolution | Not yet | Planned after expression enrichment. |

---
## Core Concepts

### Trigger Block
Defines what starts the workflow.

```locus
workflow OrderWebhook {
  trigger { on:webhook(secret: ORDER_HOOK) }
  steps { run processOrder() }
}
```
Supported today:
* `on:webhook(secret: NAME)` – secret captured as `secretRef`.
* `on:create(Entity)` / `on:update(Entity)` / `on:delete(Entity)` – basic detection.

> Mixing a webhook trigger with any entity trigger is currently disallowed (validator enforced).

### Steps Block
Contains an ordered list of step statements. Each statement produces a stable manifest entry.

#### `run`
Executes a named action (resolved at runtime by your actions table / environment). Arguments are tokenized; a single bare argument is parsed as an expression for future semantic checks.

```locus
workflow ExampleRun { trigger { t } steps { run enrichUser(userId) } }
```

#### `delay`
Placeholder (simulated). Presently logs the step; future: configurable durations.

```locus
workflow ExampleDelay { trigger { t } steps { delay { } } }
```

#### `branch`
Conditional execution. Heuristically extracts `condition:` portion; minimal expressions supported.

```locus
workflow ExampleBranch { trigger { t } steps { branch { condition: userIsAdmin steps { run grantAccess() } else { run grantBasic() } } } }
```

#### `forEach`
Iterates a collection; sets loop binding each iteration.

```locus
workflow ExampleLoop { trigger { t } steps { forEach item in items { run process(item) } } }
```

#### `send_email`
Validates presence of `to` and at least one of `subject` or `template`.

```locus
workflow ExampleEmail { trigger { t } steps { send_email { to: userEmail, subject: AccountActivated, template: account_activation.html } } }
```

#### `http_request` (Placeholder)
Syntax recognized; runtime execution is not implemented yet. Safe to include for forward compatibility.

```locus
workflow ExampleHttp { trigger { t } steps { http_request { } } }
```

### Retry Strategy

Attach a `retry` block at workflow root. Applied during execution for retryable steps (core steps use it today in a simplified loop).

```locus
workflow ExampleRetry { trigger { t } steps { run act() } retry { max: 3, backoff: exponential, factor: 2 } }
```

Validation rules:
* `max`: 0–100 integer.
* `backoff`: `fixed` or `exponential`.
* `factor` > 1 required for `exponential`.

### Concurrency Control

Limits concurrent executions by group. Queues overflow instead of dropping (simple FIFO in-memory simulation).

```locus
workflow ExampleConcurrency { trigger { t } steps { run act() } concurrency { group: welcomeGroup, limit: 5 } }
```

### Error Paths: `on_error` vs `on_failure`

* `on_error` executes recovery actions first.
* If no `on_error`, `on_failure` is executed.
* Both blocks list bare action names (no args yet in MVP).

```locus
workflow ExampleErrors {
  trigger { t }
  steps { run risky() }
  on_error { notifyAdmin rollback }
  on_failure { cleanup }
}
```

### Execution Log

Runtime produces an ordered log; each entry includes `kind` and `v: 1` (schema version). Useful for debugging & future tracing tooling.

### Manifest Output

Each workflow generates `generated/workflows/<Name>.json` (version 2). Example (trimmed):

```jsonc
{
  "name": "WelcomeEmail",
  "version": 2,
  "triggerMeta": { "type": "webhook", "secretRef": "HOOK_SECRET" },
  "steps": [
    { "kind": "run", "action": "hydrateUser" },
    { "kind": "branch", "condition": "userIsAdmin" },
    { "kind": "send_email", "email": { "to": "userEmail", "subject": "Welcome", "template": "welcome_template.html" } }
  ],
  "retry": "max: 2, backoff: exponential, factor: 2"
}
```

---
## Custom Step Kinds (Plugins)

Define a plugin (`locus.plugins.js`) and register new kinds:

```js
export default [{
  name: 'myWorkflowExt',
  registerWorkflowStepKinds() {
    return [{
      kind: 'publish_event',
      run(step, { ctx }) {
        // custom execution logic (MVP: synchronous)
        return { published: true };
      }
    }];
  }
}];
```

> Hooks: `onWorkflowParse`, `onWorkflowValidate` let plugins inspect or warn. Slow hooks trigger performance warnings (>50ms).

---
## Limitations & Roadmap

| Not Yet | Planned Direction |
| ------- | ----------------- |
| Rich async scheduling / real delays | Integrate simulated clock & timers. |
| State mutation (`update_state`) | Declarative state graph + diff generation. |
| Cancel policies / `on_cancel` | Cooperative cancellation + compensation hooks. |
| HTTP request runtime | Fetch + retries + auth injection. |
| Expression type inference | Static validation of identifiers & members. |
| Enhanced error spans | Token-level highlights for every step keyword & field. |

---
## Additional Examples

### Entity Trigger
```locus
workflow NewUserAudit {
  trigger { on:create(User) }
  steps { run seedProfile(userId) }
}
```

### Email Only
```locus
workflow SimpleEmail {
  trigger { on:webhook(secret: MAIL_HOOK) }
  steps { send_email { to: adminEmail, subject: Ping } }
}
```

### Retry + Failure Path
```locus
workflow CriticalJob {
  trigger { on:webhook(secret: JOB) }
  steps { run performRisky() }
  retry { max: 5, backoff: exponential, factor: 2 }
  on_failure { alertOps }
}
```

---
## Parsing Notes (MVP Safety Rails)

To keep error messages crisp we intentionally stop at the first syntax issue. Complex nested braces inside steps may be rejected until higher-fidelity parsing lands. If you hit an unexpected parse error, simplify the step or open an issue with the snippet.

---
## Summary

Workflows give you a single, inspectable source of truth for background logic. The current surface focuses on clarity and deterministic output. Add them incrementally; the validator will guide you when you wander into not‑yet‑implemented territory.

