// Metrics collection harness (Phase 1 minimal)
// Collect basic timings & error suggestion usage counts.

interface MetricsData {
  timings: Record<string, number>;
  suggestionsServed: number;
  deprecationsUsed: number;
  uploadFilesProcessed: number;
  uploadBytesProcessed: number;
  uploadFailures: Record<string, number>; // by error code
}

const data: MetricsData = { timings: {}, suggestionsServed: 0, deprecationsUsed: 0, uploadFilesProcessed: 0, uploadBytesProcessed: 0, uploadFailures: {} };

export function recordTiming(name: string, ms: number) { data.timings[name] = ms; }
export function incSuggestions(n = 1) { data.suggestionsServed += n; }
export function incDeprecations(n = 1) { data.deprecationsUsed += n; }
export function incUploadFiles(n = 1) { data.uploadFilesProcessed += n; }
export function incUploadBytes(n = 0) { data.uploadBytesProcessed += n; }
export function incUploadFailure(code: string) { data.uploadFailures[code] = (data.uploadFailures[code]||0)+1; }
export function exportMetrics(): MetricsData { return { ...data, timings: { ...data.timings } }; }
