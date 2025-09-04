import type { ExprNode } from '../ast';

export interface AttrLocation { offset: number; line: number; column: number; length: number }

export type UIAttr =
  | { kind: 'string'; value: string }
  | { kind: 'expr'; value: string; ast?: ExprNode; loc?: AttrLocation }
  | { kind: 'forEach'; item: string; iterable: string };

export interface ElementNode {
  type: 'element';
  tag: string;
  attrs: Record<string, UIAttr>;
  children: UINode[];
  start?: number; // offset in original UI source
  end?: number;   // exclusive offset
  loc?: { line: number; column: number; endLine: number; endColumn: number };
}

export interface TextNode { type: 'text'; value: string; start?: number; end?: number }
export interface ExprNodeUI { type: 'expr'; value: string; ast?: ExprNode; loc?: AttrLocation; start?: number; end?: number }

export interface IfNode {
  type: 'if';
  condition: string;
  consequent: UINode[];
  elif?: Array<{ condition: string; children: UINode[]; start?: number; end?: number }>;
  else?: UINode[];
  start?: number; end?: number;
}

export interface ForEachNode {
  type: 'forEach';
  item: string;
  iterable: string;
  template: ElementNode; // element to render per item
  start?: number; end?: number;
}

export type UINode = ElementNode | TextNode | ExprNodeUI | IfNode | ForEachNode;
