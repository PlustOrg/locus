// Core AST node types for Locus

export interface LocusFileAST {
  databases: DatabaseBlock[];
  designSystems: DesignSystemBlock[];
  pages: PageBlock[];
  components: ComponentBlock[];
  stores: StoreBlock[];
  // optional: file this AST came from (for diagnostics)
  sourceFile?: string;
}

export interface DatabaseBlock {
  type: 'database';
  entities: Entity[];
}

export interface Entity {
  name: string;
  fields: Field[];
  relations: Relation[];
  nameLoc?: { line: number; column: number };
}

export type FieldTypeName =
  | 'String'
  | 'Text'
  | 'Integer'
  | 'Decimal'
  | 'Boolean'
  | 'DateTime'
  | 'Json';

export interface FieldType {
  kind: 'primitive';
  name: FieldTypeName;
  optional?: boolean; // if `?`
}

export interface FieldAttributeDefault {
  kind: 'default';
  value: string | number | boolean | { call: string; args?: Array<string | number | boolean> };
}

export interface FieldAttributeUnique { kind: 'unique' }
export interface FieldAttributeMap { kind: 'map'; to: string }

export type FieldAttribute = FieldAttributeDefault | FieldAttributeUnique | FieldAttributeMap;

export interface Field {
  name: string;
  type: FieldType;
  attributes: FieldAttribute[];
}

export type RelationKind = 'has_many' | 'belongs_to' | 'has_one';

export interface Relation {
  name: string; // field name
  kind: RelationKind;
  target: string; // entity name
  attributes: FieldAttribute[]; // e.g., unique on belongs_to for 1-1
  optional?: boolean; // for belongs_to ?
}

// Design System (Phase 1.2)
export interface DesignSystemBlock {
  type: 'design_system';
  colors?: Record<string, Record<string, string>>; // theme -> token -> value
  typography?: {
    fontFamily?: string;
    baseSize?: string;
    weights?: Record<string, number>;
  };
  spacing?: Record<string, string>;
  radii?: Record<string, string>;
  shadows?: Record<string, string>;
}

// Features (Phase 1.3) - keep minimal placeholders for now
export interface PageBlock { type: 'page'; name: string; nameLoc?: { line: number; column: number } }
export interface ComponentBlock { type: 'component'; name: string; nameLoc?: { line: number; column: number } }
export interface StoreBlock { type: 'store'; name: string; nameLoc?: { line: number; column: number } }

export interface ProjectAST {
  files: LocusFileAST[];
}
