# Telemetry Opt-In (Placeholder)

Status: Planned. No telemetry is collected today.

## Goals
- Provide optional, explicit opt-in for anonymous usage metrics.
- Help prioritize language & DX improvements while preserving privacy.

## Principles (Draft)
| Principle | Description |
|-----------|-------------|
| Explicit Opt-In | Disabled by default; requires user action (`locus telemetry enable`). |
| Minimal Surface | Only aggregate feature usage counters, not code or identifiers. |
| Transparency | Clear docs on exactly what is sent and how to disable. |
| Revocable | `locus telemetry disable` removes config + stops emission immediately. |
| Privacy by Design | No PII, project names, file paths, or source snippets. |

## Proposed Data Points
- CLI command name & success/failure
- Count of entities, pages, workflows (bucketed ranges)
- Parser / build phase duration buckets
- Language feature flags (enabled/disabled) counts

All payload fields will be enumerated in a generated schema published alongside releases.

## Configuration (Proposed)
```toml
[telemetry]
enabled = false
endpoint = "https://telemetry.locus.dev/v1" # default; can self-host
```

## Opt Out
Set `LOCUS_TELEMETRY=0` or leave config disabled (default). Runtime also respects common CI envs to auto-disable.

## Next Steps
- Finalize schema & config key names
- Implement local queue with backoff & size cap
- Provide `locus telemetry status` command

---
_Last updated: 2025-09-04_
