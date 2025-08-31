// Feature flag infrastructure (Phase 1 scaffold)
// Reads flags from config via injection; simple helper used in code paths.

export interface FlagProvider { getFlag(name: string): any }

export class StaticFlags implements FlagProvider {
  constructor(private flags: Record<string, any> = {}) {}
  getFlag(name: string) { return this.flags[name]; }
}

let activeProvider: FlagProvider = new StaticFlags();
export function setFlagProvider(p: FlagProvider) { activeProvider = p; }
export function flagEnabled(name: string, expected: any = true): boolean {
  try { return activeProvider.getFlag(name) === expected; } catch { return false; }
}
