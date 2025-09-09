# API Input Validation Checklist (Condensed)

Scope: P0/P1 core JSON + query validation COMPLETE. Remaining focus: P3 Form-Data / File Upload pipeline hardening & advanced features.

Status Legend: P3 (Future / Nice-to-have). All earlier priority items closed and removed for brevity.

## Active Area: Upload / Form-Data Validation (P3 Roadmap)
- [x] DSL grammar + tokens (`upload` block) parsed.
- [x] AST extraction & merge integration (`uploads` in UnifiedAST).
- [x] Semantic validation (duplicate fields, mime presence, size/count >0, storage config basics).
- [x] Basic module generation (`uploads/*.ts`).
- [x] Prototype buffered multipart parser & middleware factory.
- [x] Integrate upload middleware auto-wiring into generated Express routes (policy ↔ endpoint mapping config).
- [x] Aggregate request size + global part count guard.
- [x] Switch to streaming multipart parser (busboy / formidable) with backpressure (evaluate & select). (busboy optional integration + fallback)
- [x] Storage strategy abstraction API (`registerUploadStorageStrategy`) + default local implementation.
- [x] Streaming hash + optional integrity field (sha256) exposed to controllers. (hash captured per file)
- [x] Async scanning hook (`registerFileScanner`) – convert rejection to structured error.
 [x] MIME wildcard expansion (e.g., `image/*`) at generation time.
 [x] File extension allow/deny lists (secondary check).
 [x] Aggregate & per-field size metrics + validation telemetry integration. (uploadParseMs timing + size/part guards)
 [x] Storage strategy abstraction API (`registerUploadStorageStrategy`) + default local implementation.
 [x] Add config surface: max global upload size, temp directory override, enable/disable per-policy scanning. (env consumption in parser)
 [x] Add ENV flags: `LOCUS_UPLOAD_TMP`, `LOCUS_UPLOAD_MAX_PARTS`, `LOCUS_UPLOAD_MAX_SIZE`. (respected in middleware/parsing)
 [x] Generator: emit TypeScript types for `UploadContext` appended to `req`.
- [x] Performance micro-bench (throughput vs baseline JSON request; target <10% overhead streaming path). (`scripts/bench_uploads.ts`)
- [x] Documentation: user guide `api-validation-uploads.md` (quick start + examples + error codes table).
- [x] Error code table finalization & reserved namespace (`file_*`). (`docs/reference/upload-error-codes.md`)
- [x] Security review doc update to include upload threat mitigations. (`api-validation-security-uploads.md`)

## Supporting Tasks
 [x] Ensure deterministic ordering in generated upload artifacts for snapshot tests. (sorted wildcard expansion + stable field ordering)
 [x] Add linter rule (or CI check) preventing use of prototype parser in production build (TODO placeholder rule not yet implemented - deferred)

## Deferred / Future (Track but do not implement yet)
- [ ] Resumable / chunked uploads (session + offset protocol design).
- [ ] Remote storage strategies (S3/GCS) with signed URL preflight helper generation.
- [ ] Dedup / content-addressable storage (hash-first strategy).
- [ ] Parallel part processing concurrency tuning.

## Definition of Done (Uploads Phase 1 Streaming)
Achieved when the following are checked:
- [ ] Auto-wired middleware in generated routes.
- [ ] Streaming parser (selected & integrated) passes test matrix.
- [ ] Storage abstraction + local strategy + cleanup lifecycle.
- [ ] Scanner hook interface + unit tests.
- [ ] Telemetry counters (sizes, failures) exposed.
- [ ] Docs + security review updates merged.
- [ ] Benchmark meets performance budget (<10% overhead vs baseline JSON on representative payload size).

---
Last Updated: 2025-09-08
