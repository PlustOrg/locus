// UI AST type definitions extracted from react generator for clarity (no behavior change)
export type UIAttr = { kind: 'string'; value: string } | { kind: 'expr'; value: string } | { kind: 'forEach'; item: string; iterable: string };
export type IfNode = { type: 'if'; condition: string; consequent: UINode[]; elif?: Array<{ condition: string; children: UINode[] }>; else?: UINode[] };
export type ForEachNode = { type: 'forEach'; item: string; iterable: string; template: any };
export type UINode = { type: 'text'; value: string } | { type: 'element'; tag: string; attrs: Record<string, UIAttr>; children: UINode[] } | IfNode | ForEachNode | { type: 'slot'; name: string };
