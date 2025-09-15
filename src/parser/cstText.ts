import { CstChildrenDictionary, CstNode, IToken } from 'chevrotain';

/**
 * Extract a contiguous source slice covering all tokens under a CST node.
 * Mirrors existing ad-hoc logic in multiple modules; centralized here for reuse.
 * Pure: does not mutate the CST.
 */
export function sliceFromCst(node: CstNode, source: string): string {
  const tokens: IToken[] = [];
  const visit = (n: CstNode) => {
    const ch = n.children as CstChildrenDictionary;
    for (const key of Object.keys(ch)) {
      const arr = (ch as any)[key] as Array<IToken | CstNode>;
      if (!Array.isArray(arr) || !arr.length) continue;
      const first = arr[0] as any;
      if (first && first.image !== undefined) {
        tokens.push(...(arr as IToken[]));
      } else {
        for (const sub of arr as CstNode[]) visit(sub);
      }
    }
  };
  visit(node);
  if (!tokens.length) return '';
  const start = Math.min(...tokens.map(t => t.startOffset ?? 0));
  const end = Math.max(...tokens.map(t => (t.endOffset ?? t.startOffset ?? 0)));
  return source.slice(start, end + 1);
}

/**
 * Attempt to extract text via first/last token offsets (alternate strategy).
 * Equivalent behavior to inline extractText in modularAstBuilder.
 */
export function extractTextSpan(node: CstNode, source: string): string {
  if (!source) return '';
  const anyNode: any = node;
  const childArrays: any[] = anyNode.children ? Object.values(anyNode.children) : [];
  let min = Infinity; let max = -1;
  for (const arr of childArrays) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr as any[]) {
      if (item && item.startOffset != null) {
        if (item.startOffset < min) min = item.startOffset;
        if (item.endOffset != null && item.endOffset > max) max = item.endOffset;
      }
    }
  }
  if (min === Infinity || max < 0) return '';
  return source.slice(min, max + 1);
}
