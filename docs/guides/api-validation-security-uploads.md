---
title: Upload Validation Security Review (Addendum)
description: Threat analysis & mitigations for file upload pipeline.
---

# Upload Validation Security Review (Addendum)

This document supplements the core API validation security guide with file upload specific risks.

## 1. Threats & Mitigations
| Threat | Mitigation |
|--------|------------|
| Oversized payload (DoS) | Aggregate size & per-file size limits (`LOCUS_UPLOAD_MAX_SIZE`, `maxSize`) |
| Excessive parts | `LOCUS_UPLOAD_MAX_PARTS` guard |
| MIME spoofing | Dual MIME + extension checks; wildcard expansion resolved build-time |
| Path traversal via filename | Filenames ignored; generated UUID/hash naming |
| Malware content | Scanner hook (`registerFileScanner`) for future AV integration |
| Resource exhaustion via buffering | Streaming parser (Busboy) preferred; fallback only if not installed |
| Temp file accumulation | Planned cleanup lifecycle (Phase 1 DoD) |
| Prototype pollution via field names | Non-file fields passed through existing JSON validator |
| Race condition writing files | Dedicated temp dir under controlled path (non-user provided) |

## 2. Open Items
- Implement temp file cleanup on abort/response end.
- Add image metadata validation (dimensions) to detect pixel bombs.
- Integrate scanning sample plugin & doc.

## 3. Logging & Telemetry
- `uploadParseMs` timing recorded.
- Future: count failures per error code for anomaly detection.

---
Last Updated: 2025-09-09