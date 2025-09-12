// Runtime-adjustable expression function whitelist extension.
// This enables config-driven or test-driven injection of additional safe expression functions.

let extra = new Set<string>();

export function __injectCustomExpressionFunctions(fns: string[]) {
  for (const f of fns) extra.add(f);
}
export function __resetCustomExpressionFunctions() { extra = new Set(); }
export function isCustomExprFunction(name: string) { return extra.has(name); }
