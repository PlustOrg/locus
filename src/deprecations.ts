import { incDeprecations } from './metrics';

let depCount = 0;
// Deprecation warning scaffolding (Phase 1)
// Call registerDeprecation when encountering legacy syntax.

interface DeprecationRecord { id: string; message: string; removal?: string; suggestion?: string; date?: string; count: number }
const records: DeprecationRecord[] = [];
const seen = new Map<string, DeprecationRecord>();

export function registerDeprecation(id: string, message: string, removal?: string, suggestion?: string, date: string = new Date().toISOString().slice(0,10)) {
  const existing = seen.get(id);
  if (existing) { existing.count++; depCount++; incDeprecations(); return; }
  const rec: DeprecationRecord = { id, message, removal, suggestion, date, count: 1 };
  seen.set(id, rec);
  records.push(rec);
  depCount++;
  incDeprecations();
}

export function collectDeprecationWarnings(): string[] {
  const lines = records.map(r => {
    const sched = r.removal ? ` (removal: ${r.removal} | scheduled ${r.date})` : '';
    const sug = r.suggestion ? ' -> ' + r.suggestion : '';
    return `[deprecation] ${r.message}${sched}${sug}`;
  });
  if (records.length) {
    lines.push('[deprecation-summary] ' + records.map(r => `${r.id} x${r.count}`).join(', '));
  }
  return lines;
}
export function getDeprecationUsageCount() { return depCount; }

export function listDeprecations(): DeprecationRecord[] { return records.slice(); }

export function resetDeprecations(){
  records.splice(0, records.length); seen.clear();
}
