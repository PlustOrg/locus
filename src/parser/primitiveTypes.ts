/**
 * Primitive token name constants shared by builders.
 * Order is significant for deterministic detection (first match wins) and guarded by tests.
 * Pure: no side effects, only string transformations.
 */
export const PRIMITIVE_TOKEN_NAMES = [
  'StringT','TextT','IntegerT','DecimalT','BooleanT','DateTimeT','JsonT','BigIntT','FloatT','UUIDT','EmailT','URLT'
] as const;

export type PrimitiveTokenName = typeof PRIMITIVE_TOKEN_NAMES[number];

/** Map Chevrotain token name to AST primitive name. */
export function primitiveTokenToName(tok: PrimitiveTokenName): string {
  return tok.replace(/T$/, ''); // e.g. StringT -> String
}

/** Detect first primitive token name key present in a children dict. */
export function detectPrimitive(children: Record<string, any>): PrimitiveTokenName | undefined {
  for (const k of PRIMITIVE_TOKEN_NAMES) if (children[k]) return k;
  return undefined;
}
