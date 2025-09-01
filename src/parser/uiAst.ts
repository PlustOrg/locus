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
}

export interface TextNode { type: 'text'; value: string; }
export interface ExprNodeUI { type: 'expr'; value: string; ast?: ExprNode; loc?: AttrLocation }

export interface IfNode {
  type: 'if';
  condition: string;
  consequent: UINode[];
  elif?: Array<{ condition: string; children: UINode[] }>;
  else?: UINode[];
}

export interface ForEachNode {
  type: 'forEach';
  item: string;
  iterable: string;
  template: ElementNode; // element to render per item
}

export type UINode = ElementNode | TextNode | ExprNodeUI | IfNode | ForEachNode;
