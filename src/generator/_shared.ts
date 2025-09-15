// Shared generator utilities (pure, no side effects). Extracted from scattered helpers.

export function pluralize(name: string): string {
  if (name.endsWith('y') && !/[aeiou]y$/i.test(name)) return name.slice(0, -1) + 'ies';
  if (name.endsWith('s')) return name + 'es';
  return name + 's';
}

export function kebabCasePageName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .toLowerCase();
}

export function sortByName<T extends { name: string }>(arr: T[]): T[] {
  return [...arr].sort((a,b)=> a.name.localeCompare(b.name));
}

export function stableJSONString(obj: any): string {
  // Deterministic stringify (simple: rely on JSON.stringify ordering of created literal with sorted keys)
  return JSON.stringify(sortKeysDeep(obj), null, 2);
}

function sortKeysDeep(value: any): any {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const k of Object.keys(value).sort()) out[k] = sortKeysDeep(value[k]);
    return out;
  }
  return value;
}
