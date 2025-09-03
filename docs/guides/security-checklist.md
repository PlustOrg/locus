# Security Checklist (Draft)

Status: Initial draft. This fulfills the GA readiness task "Security checklist".

## Build & Supply Chain
- [ ] Dependency pinning (package.json + lockfile committed)
- [ ] No usage of deprecated or high CVE packages (automated `npm audit --production` clean)
- [ ] Integrity: generated code does not execute remote URLs

## Secrets & Configuration
- [ ] No plaintext secrets committed (scanned via regex & entropy)
- [ ] Environment variable names documented (`LOCUS_*`)
- [ ] JWT secret required only when auth configured

## Plugin Isolation
- [x] Optional VM sandbox flag: `LOCUS_PLUGIN_ISOLATE=1`
- [ ] WASM sandbox (future hardening)
- [x] Memory guard per hook: `LOCUS_PLUGIN_HOOK_MEM_KB`
- [x] Module allow-list via `LOCUS_PLUGIN_ALLOW`

## Runtime Hardening
- [ ] Disable eval patterns in generated output
- [x] JIT workflow compilation behind opt‑in flag `LOCUS_WORKFLOW_JIT`
- [ ] Rate limiting / auth middleware defaults (future)

## Error Handling
- [x] Structured error reporting w/ file, line, column
- [ ] Redaction of sensitive values in diagnostics (none yet emitted)

## Logging & Metrics
- [x] Metrics summary JSON (timings + memory)
- [ ] Optional anonymized telemetry (future opt-in)

## Documentation
- [x] This checklist published
- [ ] Link from main README (pending once stabilized)

---
Future enhancements tracked under Post-GA section.
