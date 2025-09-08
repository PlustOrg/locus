import { registerValidationLogger } from './validateRuntime';

interface FeedbackSnapshot {
  entity: string;
  total: number;
  failures: number;
  lastErrorCount: number;
  lastDurationMs: number;
  lastAt: number;
}

const stats: Record<string, FeedbackSnapshot> = Object.create(null);

export function getValidationFeedback() {
  // return shallow clone to avoid mutation
  return Object.values(stats).map(s => ({ ...s }));
}

if (process.env.LOCUS_VALIDATION_FEEDBACK !== '0') {
  registerValidationLogger(ev => {
    let s = stats[ev.entity];
    if (!s) {
      s = stats[ev.entity] = { entity: ev.entity, total: 0, failures: 0, lastErrorCount: 0, lastDurationMs: 0, lastAt: 0 };
    }
    s.total++;
    if (!ev.ok) s.failures++;
    s.lastErrorCount = ev.errors;
    s.lastDurationMs = ev.durationMs;
    s.lastAt = Date.now();
  });
}
