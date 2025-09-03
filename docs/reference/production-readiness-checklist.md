# Production Readiness Checklist (Draft Template)

Status: Draft (task: "Draft template"). The "Fill with measured KPIs" task remains open.

## 1. Core Quality
- [ ] All tests passing (unit, integration, perf, fuzz)
- [ ] Lint + format clean
- [ ] Deterministic builds (hash test green)

## 2. Performance Budgets
Current locked budgets (see `scripts/perf-budgets.json`):
- Parse duration max: 180 ms
- Parse memory delta max: 9.5 MB
- Workflow parse (50 workflows): 400 ms
- Entity 200 memory delta: 15 MB

Verification:
- [ ] Baseline metrics within budgets (automated tests)
- [ ] 3 consecutive CI runs within 95% of budget

## 3. Security
- [ ] Security checklist reviewed
- [ ] Plugin isolation flag documented
- [ ] No high severity vulns (`npm audit`)

## 4. Deprecations
- [ ] All planned removals executed OR gated for next minor
- [ ] Deprecation stats file shows zero legacy forms (paren attributes)

## 5. Documentation
- [ ] Getting Started accurate
- [ ] Migration guides updated for latest syntax
- [ ] Production deploy guide (scaling, env vars)

## 6. Observability
- [ ] Metrics summary file consumed by CI dashboard
- [ ] Optional telemetry decision (defer / implement)

## 7. Release Logistics
- [ ] Changelog entries for all user-visible changes
- [ ] Version bump script executed
- [ ] Release notes drafted (features, breaking changes, upgrade steps)

## 8. Post-Release Monitoring Plan
- [ ] Error rate thresholds defined
- [ ] Performance regression watch (parse & memory)

---
To auto-fill KPIs later, add a script that ingests latest `generated/METRICS_SUMMARY.json` and updates a KPIs section.
