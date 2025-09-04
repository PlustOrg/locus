# Deprecation Metrics & Tracking

This guide explains how teams can monitor and act on deprecation usage before removal gates are enforced.

## What Is Counted
- Occurrences of legacy syntax patterns (e.g. paren attributes) during parse/validation.
- (Planned) Usage counts for deprecated workflow step forms or UI event casing.

## Where Counts Appear
Currently surfaced via build warnings (pretty output) and planned JSON structured output (future flag). Example warning:
```
Deprecated (legacy) attribute syntax '(...)' on field 'email' (1 remaining).
```

## CI Strategy
1. Run `locus build --errors json > build.json` (future when JSON includes `deprecations`).
2. Parse `deprecations` array; fail pipeline if any `severity` >= `error` OR counts exceed internal threshold.

## Environment Gate
Set `REMOVE_PAREN_ATTRS=1` to elevate legacy paren attributes to hard errors early.

## Exporting Counts (Interim)
Until JSON export lands, capture build stdout and grep:
```bash
locus build 2>&1 | grep -i "Deprecated (legacy) attribute"
```
Aggregate counts over time (e.g. weekly) to verify migration velocity.

## Future Enhancements
| Item | Status |
|------|--------|
| JSON deprecation block (`deprecations: []`) | Planned |
| Numeric usage threshold auto-gate | Planned |
| `locus deprecations report --format=md` | Planned |

---
_Last updated: 2025-09-04_
