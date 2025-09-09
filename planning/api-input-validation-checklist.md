# API Input Validation Checklist (Active Backlog Only)

All Phase 1 items complete; below list shows only remaining and future planned work.

## Phase 2 Hardening & Advanced Backlog
- [ ] Centralized upload config module (`uploadConfig.ts`) for env parsing (single source for size/parts/tmp/extensions).
- [ ] Enforce streaming dependency: fail fast if `LOCUS_UPLOAD_STREAMING=1` and Busboy absent; add optional dependency docs.
- [ ] Extended test matrix: aggregate size (streaming), extension allow/deny, storage failure injection, scanner failure via middleware, multi-file `maxCount>1`, truncated boundary, wildcard expansion uniqueness, fallback path coverage.
- [ ] Temp file retention policy & config (`LOCUS_UPLOAD_RETENTION_MINUTES`) + scheduled cleanup or post-response deletion for local strategy.
- [ ] CI benchmark gating: compare `bench_uploads` results vs previous commit; fail on >10% regression.
- [ ] Image metadata probe (dimensions) optional annotation design (`@image(maxWidth,maxHeight)`).
- [ ] Sample scanner plugin (e.g., reject oversized PNG) documented & tested.
- [ ] Per-error telemetry export artifact (`UPLOAD_METRICS.json`) on build or periodic flush.
- [ ] Remote storage strategy scaffolds (S3/GCS) + design doc for signed URL preflight.
- [ ] Resumable/chunked upload design draft (session tokens, offset, integrity hash chaining).
- [ ] Dedup/content-addressable storage option using hash naming first-class.
- [ ] Parallel part processing/concurrency tuning & backpressure tests.
- [ ] Stronger linter/CI rule to block committing if legacy buffered parser used without explicit fallback comment.
- [ ] Middleware unit test harness to simulate Express pipeline for scanner/storage failure branches.

## Phase 3 (Future / Nice-to-have)
- [ ] Virus/malware scanning integration contract & async quarantine workflow.
- [ ] Image transcoding/optimization hooks.
- [ ] Encryption at rest for temp files (optional flag).
- [ ] Upload progress events / SSE channel integration.
- [ ] Resumable / chunked uploads (session + offset protocol design).
- [ ] Remote storage strategies (S3/GCS) with signed URL preflight helper generation.
- [ ] Dedup / content-addressable storage (hash-first strategy).
- [ ] Parallel part processing concurrency tuning.

---
Last Updated: 2025-09-09
