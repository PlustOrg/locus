---
title: Validation CLI & Environment
description: Controlling validation behavior via environment variables and future CLI flags.
---

# Validation CLI & Environment

Locus validation behavior can be tuned with environment variables (flags may be added later):

| Variable | Purpose | Default |
|----------|---------|---------|
| `LOCUS_VALIDATION_FAIL_LIMIT` | Per-entity soft cap of failures per minute before `rateLimited` meta flag is set. | `200` |
| `LOCUS_VALIDATION_LOG` | When set (non-`0`), emits structured JSON lines to stderr for validation failures & rate limit events. | unset |

Structured log sample:
```
{"lvl":"debug","msg":"validation_fail","entity":"User","count":5}
{"lvl":"warn","msg":"validation rate limit exceeded","entity":"User","count":205,"limit":200}
```

These logs can be shipped to aggregation systems for anomaly detection.

Planned CLI flags (not yet implemented):

- `--validation-log` to force logging regardless of env.
- `--validation-fail-limit <n>` to override default.

Future roadmap: remote telemetry batching and adaptive throttling.
