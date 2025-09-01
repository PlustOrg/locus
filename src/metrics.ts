// Metrics collection harness (Phase 1 minimal)
// Collect basic timings & error suggestion usage counts.

interface MetricsData {
  timings: Record<string, number>;
  suggestionsServed: number;
  deprecationsUsed: number;
}

const data: MetricsData = { timings: {}, suggestionsServed: 0, deprecationsUsed: 0 };

export function recordTiming(name: string, ms: number) { data.timings[name] = ms; }
export function incSuggestions(n = 1) { data.suggestionsServed += n; }
export function incDeprecations(n = 1) { data.deprecationsUsed += n; }
export function exportMetrics(): MetricsData { return { ...data, timings: { ...data.timings } }; }
