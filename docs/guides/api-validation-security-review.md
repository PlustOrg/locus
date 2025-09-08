---
title: API Validation Security Review
description: Threat model and mitigations for the validation subsystem.
---

# API Validation Security Review (Initial Draft)

## Threats & Mitigations
| Threat | Mitigation |
|--------|------------|
| Prototype pollution | Key blacklist (`__proto__`, `prototype`, `constructor`) |
| Deep recursion / resource exhaustion | Depth & array length caps, body size limit |
| Regex DoS | Pattern length cap + optional precompilation |
| Oversized field payloads | Per-field string size cap |
| Mass assignment | Unexpected property rejection |
| Enumeration probing | Deterministic errors without stack traces |
| Flood of invalid requests | Failure rate telemetry + rateLimited meta flag |

## Open Items
- Sandbox plugin constraints (future)
- Granular relation nested create validation
- i18n error message externalization

## Recommendations
1. Integrate structured logs with centralized alerting (warn on sustained rateLimited flags).
2. Add optional IP / auth correlation in future telemetry.
3. Periodically fuzz with mutation corpus pre-release.
