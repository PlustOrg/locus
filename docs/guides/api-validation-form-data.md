---
title: Form-Data & File Upload Validation Strategy (Draft)
description: Planned architecture and phased implementation for secure, deterministic multipart/form-data & file validation in Locus.
---

# Form-Data & File Upload Validation Strategy (Draft)

Status: Planning (P3). This document specifies the approach; implementation not yet started.

## 1. Goals
1. Deterministic, streaming validation of multipart/form-data without loading entire payload in memory.
2. Explicitly declared allowed file fields (no implicit acceptance) to prevent mass-assignment of arbitrary files.
3. Enforce per-file & aggregate size, count, MIME type, extension, and (optionally) image dimensions.
4. Provide hooks for asynchronous security scanning (e.g., antivirus, malware, content policy) without delaying initial validation response excessively.
5. Maintain consistency with existing JSON validator error envelope (reuse `version`, `code`, `errors[]`).

## 2. Scope (Initial Phase)
In-scope Phase 1:
- Accept `multipart/form-data` requests on routes explicitly marked with an upload spec.
- File field metadata declaration (name, maxSizeBytes, allowedMime, optional/required, maxCount).
- Non-file fields validated by existing JSON validator (merged result).
- Streaming rejection on first violation (stop reading remaining parts).

Deferred (future phases):
- Image dimension validation (needs transcode / metadata extraction).
- Virus scanning / asynchronous quarantine workflow.
- Chunked / resumable uploads.
- S3 direct-upload signed URL helpers.

## 3. DSL Additions (Proposed Syntax)
Option A (Field Annotation):
```
entity Asset {
  file String @file(maxSize: 5MB, mime: ["image/png","image/jpeg"], storage: local)
}
```
Option B (Route-Level Upload Block):
```
upload UserAvatar {
  field name: "avatar" maxSize: 5MB mime: [image/png,image/jpeg] required
  store strategy: local path: "uploads/avatars" naming: uuid
}
```

Recommended: Start with Route-Level `upload` block to avoid overloading data model semantics and to allow multiple different upload policies referencing same entity.

### Tokens / Grammar
- New keywords: `upload`, `field`, `maxSize`, `mime`, `store`, `strategy`, `path`, `naming`, `required`, `maxCount`.
- Size literals: `/^[0-9]+(B|KB|MB|GB)$/` canonicalized to bytes.

## 4. Generated Schema Representation
`validation/uploads/<Name>.ts`:
```ts
export const uploadSchema = {
  name: 'UserAvatar',
  fields: [
    { name: 'avatar', required: true, maxSize: 5*1024*1024, mime: ['image/png','image/jpeg'], maxCount: 1 }
  ],
  storage: { strategy: 'local', path: 'uploads/avatars', naming: 'uuid' }
} as const;
```

## 5. Runtime Validation Flow (Streaming)
1. Inspect `Content-Type` header; if not multipart and route expects upload → error `invalid_content_type`.
2. Use streaming multipart parser (candidate libs: busboy, formidable, undici built-in when available). NOTE: External fetching for latest best-practice pending tooling.
3. For each part:
   - If field name not in declared set → reject `unexpected_file_field`.
   - Track count per field; if exceeds `maxCount` → reject `file_count_exceeded`.
   - Accumulate size; if > maxSize → abort `file_too_large`.
   - Check MIME (header `content-type`) + extension heuristic → on mismatch `file_mime_invalid`.
4. Store file to temporary location (or memory threshold) while computing hash (sha256) if hashing enabled.
5. After all parts: ensure required fields present; merge non-file fields into body and run existing JSON validation.
6. Return errors in unified envelope; on success attach `files: [{ field, path, size, mime, hash }]` to request context for controller.

## 6. Error Codes (Planned)
`invalid_content_type`, `unexpected_file_field`, `file_too_large`, `file_count_exceeded`, `file_mime_invalid`, `file_required_missing`, `file_stream_error`.

## 7. Security Considerations
| Risk | Mitigation |
|------|-----------|
| Zip bombs / huge files | Per-file & aggregate size limits, early abort |
| MIME spoofing | Dual check (Content-Type + extension whitelist) |
| Path traversal | Ignore client filenames; generate safe names (uuid) |
| DoS via many small parts | Max part count enforcement |
| Race storing temporary files | Use dedicated temp dir with `0600` perms |
| Malware | Provide scanning hook (future) before final persistence |

## 8. Storage Strategies (Abstraction)
Initial: `local` only.
Interface draft:
```ts
interface UploadStorageStrategy {
  persist(tempPath: string, meta: { field: string; mime: string; size: number; hash: string }): Promise<{ url: string; id?: string }>;
  cleanup?(tempPath: string): Promise<void>;
}
```
Future: `s3`, `gcs`, `memory` (tests).

## 9. Hooks
- `registerUploadStorageStrategy(name, impl)`
- `registerFileScanner(fn)` async; if rejects -> convert to validation error `file_scanner_failed`.

## 10. Incremental Implementation Phases
| Phase | Deliverables |
|-------|--------------|
| 1 | Grammar + AST for `upload` block, schema generation, basic runtime (size/mime/count/required) |
| 2 | Storage abstraction + local strategy implementation, hashing |
| 3 | Integrate scanning hook + temporary file lifecycle management |
| 4 | Image dimension probe (optional) + metadata validation |
| 5 | Advanced features: parallel streaming limit, resumable uploads, per-field transform plugins |

## 11. Testing Plan
Unit: size limit, mime mismatch, missing required, multiple counts, aggregate abort.
Integration: full multipart request through generated route.
Security tests: truncated streams, early abort, malicious field names, large counts.
Performance microbench: throughput bytes/sec vs baseline; target overhead <10% vs raw disk write.

## 12. Open Questions
1. Should JSON + file fields coexist in single upload request? (Plan: Yes; pass non-file fields through validator after multipart parse.)
2. How to express image-only constraints? (Potential `@image(maxWidth:..., maxHeight:...)` annotation later.)
3. Dedup strategy (hash-based) configurable? (Future phase.)

## 13. Sample Generated Middleware (Sketch)
```ts
export function makeUserAvatarUploadHandler(schema, next){
  return function(req,res,innerNext){
    if(!/^multipart\/form-data/.test(req.headers['content-type']||'')) return res.status(400).json(validationErrorEnvelope([{ path:'', code:'invalid_content_type', message:'Expected multipart/form-data' }]));
    // stream parse parts -> validate -> attach req.filesValidated = [...];
    innerNext();
  };
}
```

## 14. Documentation Artifacts To Add (When Implemented)
- Guide: `api-validation-uploads.md`
- Quick reference section for upload error codes
- Security note: handling of temporary storage & scanning

---
Prepared: 2025-09-08
