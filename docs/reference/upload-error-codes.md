---
title: Upload Error Codes Reference
description: Reserved `file_*` and related error codes for Locus upload validation.
---

# Upload Error Codes Reference

| Code | Description | Notes |
|------|-------------|-------|
| invalid_content_type | Expected multipart/form-data | Early header check |
| unexpected_file_field | Field not declared in policy | Immediate abort |
| file_count_exceeded | Exceeded field maxCount or global part limit | Includes aggregate guard |
| file_too_large | File or aggregate size exceeded | Per-file vs aggregate distinguished by message |
| file_mime_invalid | MIME not allowed | Wildcards expanded at generation |
| file_extension_invalid | Extension denied or not in allow list | Secondary filter |
| file_required_missing | Required field absent | After streaming close |
| file_scanner_failed | Scanner hook rejected | Hook provided custom message |
| file_storage_error | Storage strategy persistence failed | Strategy-specific details hidden by default |
| file_stream_error | Low-level stream failure | Captures parser errors |
| streaming_unavailable | Streaming requested but parser missing | Buffered fallback attempted |

Reserved namespace: All future upload codes must be prefixed with `file_` except protocol-level (invalid_content_type, unexpected_file_field, streaming_unavailable).

---
Last Updated: 2025-09-09