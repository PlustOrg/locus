# Workflows (MVP)

Status: Experimental (manifest version 2)

Supported today:
- trigger { on:webhook(secret: NAME) | on:create(Entity) | on:update(Entity) | on:delete(Entity) }
- steps: run, delay, branch, for_each, send_email (raw template), http_request (raw placeholder)
- retry { max: N, backoff: fixed|exponential, factor: N, delay: N }
- concurrency { group: NAME, limit: N }
- on_error { actionOne actionTwo }
- on_failure { action } (fallback when no on_error)

Not yet implemented (documented for future): state mutation, cancel policies, advanced scheduling.

## Minimal Example
```locus
workflow Welcome {
  trigger { on:webhook(secret: HOOK_SECRET) }
  steps {
    run hydrateUser(id)
  // branch + forEach omitted in minimal snippet for brevity
  run auditLog(id)
    send_email { to: userEmail, subject: Welcome }
  }
  retry { max: 2, backoff: exponential, factor: 2 }
  concurrency { group: welcomeGroup, limit: 5 }
}
```

## Manifest Snapshot
Generated at `generated/workflows/<Name>.json` version 2.

```jsonc
{
  "name": "Welcome",
  "version": 2,
  "steps": [ { "kind": "run", "action": "hydrateUser" } ]
}
```

## Custom Steps via Plugins
Register in `locus.plugins.js` using `registerWorkflowStepKinds`.

## Branch & ForEach Examples

Branch (conditional):
```locus
workflow ConditionalAudit {
  trigger { t }
  steps {
    branch { condition: userIsAdmin steps { run audit() } else { run skip() } }
  }
}
```

ForEach iteration:
```locus
workflow TouchAll {
  trigger { t }
  steps {
    forEach item in items { run touch(item) }
  }
}
```

## Error Handling
- on_error executes first; on_failure only if no on_error.
- retry applies per step (sequential) with simple exponential multiplier.

## Concurrency
Group queue: excess executions queued rather than dropped (MVP simulation).

## Execution Log
Each log entry includes `v:1` for schema versioning.
