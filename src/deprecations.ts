// Deprecation warning scaffolding (Phase 1)
// Call registerDeprecation when encountering legacy syntax.

interface DeprecationRecord { id: string; message: string; removal?: string; suggestion?: string }
const records: DeprecationRecord[] = [];
const seen = new Set<string>();

export function registerDeprecation(id: string, message: string, removal?: string, suggestion?: string) {
  if (seen.has(id)) return; // avoid duplicates
  seen.add(id);
  records.push({ id, message, removal, suggestion });
}

export function collectDeprecationWarnings(): string[] {
  return records.map(r => `[deprecation] ${r.message}${r.removal ? ' (removal: ' + r.removal + ')' : ''}${r.suggestion ? ' -> ' + r.suggestion : ''}`);
}

export function resetDeprecations(){
  records.splice(0, records.length); seen.clear();
}
