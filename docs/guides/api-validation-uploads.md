---
title: Upload Validation Guide
description: How Locus validates multipart/form-data and file uploads.
---

# Upload Validation Guide

This guide explains how the `upload` block DSL and runtime middleware work to securely and deterministically parse and validate multipart/form-data requests.

## 1. Declaring an Upload Policy
```locus
upload UserAvatar {
  field avatar maxSize: 5MB mime: [image/png,image/jpeg] required
  store strategy: local path: "uploads/avatars" naming: uuid
}
```

## 2. Generated Artifacts
| File | Purpose |
|------|---------|
| `generated/uploads/UserAvatar.ts` | Policy JSON exported as `policy` |
| `generated/uploads/context.d.ts` | Augments Express `Request` with `uploadFiles` & `uploadBody` |

## 3. Middleware Auto-Wiring
POST routes whose base name matches the policy name (lower camelcase) automatically receive an upload middleware that:
1. Selects streaming parser (Busboy) if available, else buffered fallback.
2. Enforces aggregate size (`LOCUS_UPLOAD_MAX_SIZE`) & part count (`LOCUS_UPLOAD_MAX_PARTS`).
3. Validates each file against: field allowlist, maxCount, MIME (with wildcard expansion), extension allow/deny lists.
4. Computes SHA-256 hash and persists via storage strategy (default `local`).
5. Runs registered file scanners (`registerFileScanner`).
6. Attaches `req.uploadFiles` and `req.uploadBody` then calls downstream handler.

## 4. Environment Variables
| Name | Default | Description |
|------|---------|-------------|
| `LOCUS_UPLOAD_STREAMING` | `1` | Enable streaming parser if Busboy present. Set `0` to force buffered fallback. |
| `LOCUS_UPLOAD_MAX_SIZE` | 25MB | Aggregate request byte cap. |
| `LOCUS_UPLOAD_MAX_PARTS` | 100 | Max total parts (files + fields). |
| `LOCUS_UPLOAD_ALLOW_EXT` | (unset) | Comma list of allowed file extensions (excludes dot). |
| `LOCUS_UPLOAD_DENY_EXT` | (unset) | Comma list of denied extensions. |
| `LOCUS_UPLOAD_TMP` | `generated/tmp_uploads` | Temp directory for in-flight files. |

## 5. Error Codes
| Code | Meaning |
|------|---------|
| `invalid_content_type` | Non-multipart request where multipart expected |
| `unexpected_file_field` | File field not declared in policy |
| `file_count_exceeded` | More files than `maxCount` or part limit |
| `file_too_large` | Exceeded per-file or aggregate size limit |
| `file_mime_invalid` | MIME type not in allowed list |
| `file_extension_invalid` | Extension not allowed / explicitly denied |
| `file_required_missing` | Required file field absent |
| `file_scanner_failed` | A registered scanner rejected the file |
| `file_storage_error` | Storage strategy failed persisting file |
| `file_stream_error` | Low-level stream failure |
| `streaming_unavailable` | Streaming requested but Busboy missing (fallback attempted) |

## 6. Storage Strategies
Register a strategy:
```ts
import { registerUploadStorageStrategy } from '../runtime/storageStrategies';
registerUploadStorageStrategy('s3', { async persist(temp, meta){ /* upload */ return { url: 'https://...' }; } });
```
The `local` strategy is included by default.

## 7. Scanning Hooks
```ts
import { registerFileScanner } from '../runtime/uploadHooks';
registerFileScanner(async file => {
  if(file.mime === 'image/png' && file.size > 10*1024*1024) throw new Error('Reject huge PNG');
});
```

## 8. Security Considerations
- All file fields are explicit; unexpected fields abort early.
- Size & part counts enforced before buffering entire request when streaming.
- Filenames are ignored for storage naming; a generated UUID/hash is used.
- Extension & MIME double validation helps mitigate spoofing attempts.
- Hash available for integrity, dedup (future), or downstream scanning.

## 9. Benchmark Target
Aim: <10% overhead vs baseline JSON POST for representative payload (5MB single file). Run upcoming bench: `scripts/bench_uploads.ts` (planned).

## 10. Future Enhancements
- Image dimension probing
- Virus scanning integration
- Remote storage strategies and pre-signed URLs
- Resumable uploads

---
Last Updated: 2025-09-09
